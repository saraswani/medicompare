/**
 * Clinical Medicine Comparator Service
 * Evaluates chemical bioequivalence, dosage formulation compatibility,
 * and computes safe, strictly bounded savings.
 */

export const MATCH_STATUS = {
  EXACT_FORMULATION_MATCH: 'EXACT_FORMULATION_MATCH',
  FORMULATION_MISMATCH: 'FORMULATION_MISMATCH',
  STRENGTH_MISMATCH: 'STRENGTH_MISMATCH',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
};

export class ClinicalComparator {
  /**
   * Evaluates relationship between a prescribed medicine and an alternative.
   */
  static evaluateMatch(targetMed, altMed) {
    if (!targetMed || !altMed) {
      return {
        status: MATCH_STATUS.INSUFFICIENT_DATA,
        status_label: 'Insufficient Data',
        is_substitutable_candidate: false,
        reasons: ['Missing medicine record']
      };
    }

    // Check composition availability
    const targetComp = (targetMed.composition_key || targetMed.display_composition || '').toLowerCase().trim();
    const altComp = (altMed.composition_key || altMed.display_composition || '').toLowerCase().trim();

    if (!targetComp || !altComp) {
      return {
        status: MATCH_STATUS.INSUFFICIENT_DATA,
        status_label: 'Insufficient Data',
        is_substitutable_candidate: false,
        reasons: ['Active chemical salt data is incomplete in one or both records']
      };
    }

    // Check dosage form compatibility
    const targetForm = (targetMed.dosage_form || '').toLowerCase().trim();
    const altForm = (altMed.dosage_form || '').toLowerCase().trim();
    const isFormMatch = targetForm === altForm || 
      (targetForm.includes('tablet') && altForm.includes('tablet')) ||
      (targetForm.includes('capsule') && altForm.includes('capsule'));

    // Check release profile compatibility (e.g. SR/ER vs IR)
    const targetRelease = (targetMed.release_characteristic || 'Immediate Release').toLowerCase();
    const altRelease = (altMed.release_characteristic || 'Immediate Release').toLowerCase();
    const isReleaseMatch = targetRelease === altRelease;

    // Check exact salt composition key match
    const isSaltMatch = targetComp === altComp;

    if (!isSaltMatch) {
      return {
        status: MATCH_STATUS.STRENGTH_MISMATCH,
        status_label: 'Different Strength / Molecule',
        badge_color: 'bg-amber-100 text-amber-800 border-amber-300',
        is_substitutable_candidate: false,
        reasons: ['Active ingredients or dosages differ. Do not substitute without doctor guidance.']
      };
    }

    if (!isFormMatch || !isReleaseMatch) {
      const reasons = [];
      if (!isFormMatch) reasons.push(`Different dosage form (${targetMed.dosage_form} vs ${altMed.dosage_form})`);
      if (!isReleaseMatch) reasons.push(`Different release profile (${targetMed.release_characteristic} vs ${altMed.release_characteristic})`);

      return {
        status: MATCH_STATUS.FORMULATION_MISMATCH,
        status_label: 'Different Formulation / Release',
        badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
        is_substitutable_candidate: false,
        reasons: reasons
      };
    }

    // Full exact match
    return {
      status: MATCH_STATUS.EXACT_FORMULATION_MATCH,
      status_label: 'Identical Formulation Match',
      badge_color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      is_substitutable_candidate: true,
      reasons: ['Identical active pharmaceutical molecule, dosage strength, form, and release profile.']
    };
  }

  /**
   * Generates a complete, safe comparison between a target medicine and its candidate alternatives.
   */
  static buildComparison(targetMed, candidateAlternatives = []) {
    // Separate into exact matches, formulation mismatches, and others
    const evaluatedAlternatives = candidateAlternatives.map(alt => {
      const evaluation = this.evaluateMatch(targetMed, alt);
      const isTarget = alt.id === targetMed.id;

      // Price comparison calculation (ONLY valid when exact match and both have verified prices)
      const canComparePrice = evaluation.is_substitutable_candidate && 
                             targetMed.has_verified_price && 
                             alt.has_verified_price &&
                             targetMed.currency === alt.currency &&
                             targetMed.unit_price > 0 &&
                             alt.unit_price > 0;

      let unitDiff = 0;
      let packDiff = 0;
      let savingsPct = 0;
      let hasSavings = false;

      if (canComparePrice && !isTarget) {
        unitDiff = Math.max(0, targetMed.unit_price - alt.unit_price);
        packDiff = parseFloat((unitDiff * targetMed.pack_unit_count).toFixed(2));
        savingsPct = Math.round((unitDiff / targetMed.unit_price) * 100);
        hasSavings = unitDiff > 0.05;
      }

      return {
        ...alt,
        evaluation: evaluation,
        is_current_selection: isTarget,
        can_compare_price: canComparePrice,
        price_diff_per_unit: parseFloat(unitDiff.toFixed(2)),
        price_diff_per_pack: packDiff,
        savings_percentage: Math.max(0, savingsPct),
        has_savings: hasSavings
      };
    });

    // Find the cheapest exact substitutable match
    const validMatchesWithPrice = evaluatedAlternatives
      .filter(a => a.evaluation.is_substitutable_candidate && a.has_verified_price && a.unit_price > 0)
      .sort((a, b) => a.unit_price - b.unit_price);

    const cheapestOption = validMatchesWithPrice[0] || targetMed;
    const isCheapestDifferent = cheapestOption.id !== targetMed.id;
    const canCalculateGroupSavings = isCheapestDifferent && 
                                     targetMed.has_verified_price && 
                                     cheapestOption.has_verified_price &&
                                     targetMed.unit_price > 0 &&
                                     cheapestOption.unit_price > 0;

    const groupUnitDiff = canCalculateGroupSavings ? Math.max(0, targetMed.unit_price - cheapestOption.unit_price) : 0;
    const groupPackDiff = parseFloat((groupUnitDiff * targetMed.pack_unit_count).toFixed(2));
    const groupSavingsPct = canCalculateGroupSavings && targetMed.unit_price > 0
      ? Math.round((groupUnitDiff / targetMed.unit_price) * 100)
      : 0;

    return {
      medicine: targetMed,
      composition_key: targetMed.composition_key,
      shared_composition: targetMed.display_composition,
      dosage_form: targetMed.dosage_form,
      release_characteristic: targetMed.release_characteristic,
      salts: targetMed.salts,
      cheapest_option: cheapestOption,
      can_calculate_savings: canCalculateGroupSavings,
      savings: {
        has_savings: canCalculateGroupSavings && groupUnitDiff > 0.05,
        savings_percentage: Math.max(0, groupSavingsPct),
        savings_per_unit: parseFloat(groupUnitDiff.toFixed(2)),
        savings_per_pack: groupPackDiff,
        target_unit_price: targetMed.unit_price,
        cheapest_unit_price: cheapestOption.unit_price,
        pack_unit_count: targetMed.pack_unit_count,
        pack_unit_type: targetMed.pack_unit_type,
        currency: targetMed.currency,
        currency_symbol: targetMed.currency_symbol || '₹'
      },
      total_alternatives: evaluatedAlternatives.length,
      exact_matches_count: evaluatedAlternatives.filter(a => a.evaluation.status === MATCH_STATUS.EXACT_FORMULATION_MATCH).length,
      alternatives: evaluatedAlternatives,
      clinical_disclaimer: {
        nti_warning: 'Narrow Therapeutic Index drugs (e.g. cardiac, thyroid, epilepsy) require direct physician supervision for any brand substitution.',
        consultation_notice: 'Generic medicines contain identical active ingredients, but always confirm strength, dosage form, and doctor instructions before switching.'
      }
    };
  }
}
