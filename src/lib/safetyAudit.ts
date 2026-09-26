/**
 * Global Content Moderation Guard (AI Safety Wrapper) - Eco Challenge v2.0
 * 
 * Directs Gemini 1.5 Flash to audit text and image media before committing
 * actions to the database or state. If a violation is found, returns
 * { isSafe: false, reason: '...' } so the caller can trigger automatic account ban.
 */

export interface SafetyAuditResult {
  isSafe: boolean;
  status: 'SAFE' | 'VIOLATION';
  reason?: string;
}

export async function auditContentWithGemini(
  mediaBase64OrNull?: string | null,
  textContent?: string | null,
  language: 'en' | 'ar' = 'en'
): Promise<SafetyAuditResult> {
  const text = (textContent || '').trim();
  const image = mediaBase64OrNull || undefined;

  if (!text && !image) {
    return { isSafe: true, status: 'SAFE' };
  }

  try {
    const response = await fetch('/api/gemini/safety-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        imageBase64: image,
        mimeType: 'image/jpeg',
        language,
      }),
    });

    if (!response.ok) {
      // In case of HTTP failure, do a basic client-side safety fallback check
      const prohibitedRegex = [
        /fuck/i, /shit/i, /bitch/i, /cunt/i, /porn/i, /nazi/i, /kill/i, /suicide/i, /gore/i,
        /ارهاب/i, /اباحي/i, /شرموط/i, /منيوك/i, /كس/i, /طيز/i, /سكس/i, /عاهر/i, /انتحار/i
      ];
      if (text && prohibitedRegex.some((rx) => rx.test(text))) {
        return {
          isSafe: false,
          status: 'VIOLATION',
          reason: language === 'ar' ? 'انتهاك لقواعد الأمان ومحتوى غير لائق.' : 'Safety policy violation: inappropriate text detected.',
        };
      }
      return { isSafe: true, status: 'SAFE' };
    }

    const data = await response.json();
    if (data.status === 'VIOLATION' || data.isSafe === false) {
      return {
        isSafe: false,
        status: 'VIOLATION',
        reason: data.reason || (language === 'ar' ? 'انتهاك لقواعد الأمان والمحتوى غير اللائق' : 'Violation of community safety standards'),
      };
    }

    return { isSafe: true, status: 'SAFE' };
  } catch (err: any) {
    console.warn('AI Safety Audit network warning:', err);
    // Client-side fallback check
    const prohibitedRegex = [
      /fuck/i, /shit/i, /bitch/i, /cunt/i, /porn/i, /nazi/i, /kill/i, /suicide/i, /gore/i,
      /ارهاب/i, /اباحي/i, /شرموط/i, /منيوك/i, /كس/i, /طيز/i, /سكس/i, /عاهر/i, /انتحار/i
    ];
    if (text && prohibitedRegex.some((rx) => rx.test(text))) {
      return {
        isSafe: false,
        status: 'VIOLATION',
        reason: language === 'ar' ? 'انتهاك لقواعد الأمان ومحتوى غير لائق.' : 'Safety policy violation detected.',
      };
    }
    return { isSafe: true, status: 'SAFE' };
  }
}
