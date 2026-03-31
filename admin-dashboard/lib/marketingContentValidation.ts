type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isOptionalStringArray(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
}

function validateHomepage(content: Record<string, unknown>, errors: string[]) {
  const hero = content.hero;
  if (hero !== undefined && !isRecord(hero)) {
    errors.push('homepage.hero must be an object');
  }
  if (isRecord(hero)) {
    if (!isOptionalString(hero.eyebrow)) errors.push('homepage.hero.eyebrow must be a string');
    if (!isOptionalString(hero.title)) errors.push('homepage.hero.title must be a string');
    if (!isOptionalString(hero.description)) {
      errors.push('homepage.hero.description must be a string');
    }
    if (!isOptionalString(hero.primaryCta)) {
      errors.push('homepage.hero.primaryCta must be a string');
    }
    if (!isOptionalString(hero.secondaryCta)) {
      errors.push('homepage.hero.secondaryCta must be a string');
    }
  }

  const proofStrip = content.proofStrip;
  if (proofStrip !== undefined && !isRecord(proofStrip)) {
    errors.push('homepage.proofStrip must be an object');
  }
  if (isRecord(proofStrip) && !isOptionalStringArray(proofStrip.items)) {
    errors.push('homepage.proofStrip.items must be an array of strings');
  }

  const howItWorks = content.howItWorks;
  if (howItWorks !== undefined && !isRecord(howItWorks)) {
    errors.push('homepage.howItWorks must be an object');
  }
  if (isRecord(howItWorks)) {
    if (!isOptionalString(howItWorks.title)) {
      errors.push('homepage.howItWorks.title must be a string');
    }
    if (!isOptionalStringArray(howItWorks.steps)) {
      errors.push('homepage.howItWorks.steps must be an array of strings');
    }
  }
}

function validatePricing(content: Record<string, unknown>, errors: string[]) {
  const hero = content.hero;
  if (hero !== undefined && !isRecord(hero)) {
    errors.push('pricing.hero must be an object');
  }
  if (isRecord(hero)) {
    if (!isOptionalString(hero.eyebrow)) errors.push('pricing.hero.eyebrow must be a string');
    if (!isOptionalString(hero.title)) errors.push('pricing.hero.title must be a string');
    if (!isOptionalString(hero.description)) {
      errors.push('pricing.hero.description must be a string');
    }
  }

  const planSummaries = content.planSummaries;
  if (planSummaries !== undefined && !isRecord(planSummaries)) {
    errors.push('pricing.planSummaries must be an object');
  }
  if (isRecord(planSummaries)) {
    if (!isOptionalString(planSummaries.session)) {
      errors.push('pricing.planSummaries.session must be a string');
    }
    if (!isOptionalString(planSummaries.composer)) {
      errors.push('pricing.planSummaries.composer must be a string');
    }
    if (!isOptionalString(planSummaries.studio)) {
      errors.push('pricing.planSummaries.studio must be a string');
    }
  }
}

function validateGlobalMarketingChrome(content: Record<string, unknown>, errors: string[]) {
  const nav = content.nav;
  if (nav !== undefined && !isRecord(nav)) {
    errors.push('global_marketing_chrome.nav must be an object');
  }
  if (isRecord(nav)) {
    if (!isOptionalString(nav.pricingLabel)) {
      errors.push('global_marketing_chrome.nav.pricingLabel must be a string');
    }
    if (!isOptionalString(nav.progressionsLabel)) {
      errors.push('global_marketing_chrome.nav.progressionsLabel must be a string');
    }
    if (!isOptionalString(nav.primaryCta)) {
      errors.push('global_marketing_chrome.nav.primaryCta must be a string');
    }
    if (!isOptionalString(nav.secondaryCta)) {
      errors.push('global_marketing_chrome.nav.secondaryCta must be a string');
    }
  }

  const footer = content.footer;
  if (footer !== undefined && !isRecord(footer)) {
    errors.push('global_marketing_chrome.footer must be an object');
  }
  if (isRecord(footer)) {
    if (!isOptionalString(footer.description)) {
      errors.push('global_marketing_chrome.footer.description must be a string');
    }
  }
}

function validatePublicProgressions(content: Record<string, unknown>, errors: string[]) {
  const hero = content.hero;
  if (hero !== undefined && !isRecord(hero)) {
    errors.push('public_progressions.hero must be an object');
  }
  if (isRecord(hero)) {
    if (!isOptionalString(hero.eyebrow)) {
      errors.push('public_progressions.hero.eyebrow must be a string');
    }
    if (!isOptionalString(hero.title)) {
      errors.push('public_progressions.hero.title must be a string');
    }
    if (!isOptionalString(hero.description)) {
      errors.push('public_progressions.hero.description must be a string');
    }
  }

  const emptyState = content.emptyState;
  if (emptyState !== undefined && !isRecord(emptyState)) {
    errors.push('public_progressions.emptyState must be an object');
  }
  if (isRecord(emptyState)) {
    if (!isOptionalString(emptyState.title)) {
      errors.push('public_progressions.emptyState.title must be a string');
    }
    if (!isOptionalString(emptyState.description)) {
      errors.push('public_progressions.emptyState.description must be a string');
    }
    if (!isOptionalString(emptyState.cta)) {
      errors.push('public_progressions.emptyState.cta must be a string');
    }
  }
}

export function validateMarketingContentShape(
  contentKey: string,
  content: unknown,
): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(content)) {
    return {
      valid: false,
      errors: ['Marketing content must be a top-level JSON object'],
    };
  }

  switch (contentKey) {
    case 'homepage':
      validateHomepage(content, errors);
      break;
    case 'pricing':
      validatePricing(content, errors);
      break;
    case 'global_marketing_chrome':
      validateGlobalMarketingChrome(content, errors);
      break;
    case 'public_progressions':
      validatePublicProgressions(content, errors);
      break;
    default:
      errors.push('Unsupported marketing content key');
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
