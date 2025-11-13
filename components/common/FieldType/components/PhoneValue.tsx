"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { FieldValueProps } from '../utils';

// Minimal calling code to ISO mapping (extend as needed)
const CALLING_CODE_TO_ISO: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '20': 'EG',
  '27': 'ZA',
  '30': 'GR',
  '31': 'NL',
  '32': 'BE',
  '33': 'FR',
  '34': 'ES',
  '36': 'HU',
  '39': 'IT',
  '40': 'RO',
  '41': 'CH',
  '43': 'AT',
  '44': 'GB',
  '45': 'DK',
  '46': 'SE',
  '47': 'NO',
  '48': 'PL',
  '49': 'DE',
  '51': 'PE',
  '52': 'MX',
  '53': 'CU',
  '54': 'AR',
  '55': 'BR',
  '56': 'CL',
  '57': 'CO',
  '58': 'VE',
  '60': 'MY',
  '61': 'AU',
  '62': 'ID',
  '63': 'PH',
  '64': 'NZ',
  '65': 'SG',
  '66': 'TH',
  '81': 'JP',
  '82': 'KR',
  '84': 'VN',
  '86': 'CN',
  '90': 'TR',
  '91': 'IN',
  '92': 'PK',
  '93': 'AF',
  '94': 'LK',
  '95': 'MM',
  '98': 'IR',
  '211': 'SS',
  '212': 'MA',
  '213': 'DZ',
  '216': 'TN',
  '218': 'LY',
  '220': 'GM',
  '221': 'SN',
  '222': 'MR',
  '223': 'ML',
  '224': 'GN',
  '225': 'CI',
  '226': 'BF',
  '227': 'NE',
  '228': 'TG',
  '229': 'BJ',
  '230': 'MU',
  '231': 'LR',
  '232': 'SL',
  '233': 'GH',
  '234': 'NG',
  '235': 'TD',
  '236': 'CF',
  '237': 'CM',
  '238': 'CV',
  '239': 'ST',
  '240': 'GQ',
  '241': 'GA',
  '242': 'CG',
  '243': 'CD',
  '244': 'AO',
  '245': 'GW',
  '246': 'IO',
  '248': 'SC',
  '249': 'SD',
  '250': 'RW',
  '251': 'ET',
  '252': 'SO',
  '253': 'DJ',
  '254': 'KE',
  '255': 'TZ',
  '256': 'UG',
  '257': 'BI',
  '258': 'MZ',
  '260': 'ZM',
  '261': 'MG',
  '262': 'RE',
  '263': 'ZW',
  '264': 'NA',
  '265': 'MW',
  '266': 'LS',
  '267': 'BW',
  '268': 'SZ',
  '269': 'KM',
  '290': 'SH',
  '297': 'AW',
  '298': 'FO',
  '299': 'GL',
  '350': 'GI',
  '351': 'PT',
  '352': 'LU',
  '353': 'IE',
  '354': 'IS',
  '355': 'AL',
  '356': 'MT',
  '357': 'CY',
  '358': 'FI',
  '359': 'BG',
  '370': 'LT',
  '371': 'LV',
  '372': 'EE',
  '373': 'MD',
  '374': 'AM',
  '375': 'BY',
  '376': 'AD',
  '377': 'MC',
  '378': 'SM',
  '380': 'UA',
  '381': 'RS',
  '382': 'ME',
  '383': 'XK',
  '385': 'HR',
  '386': 'SI',
  '387': 'BA',
  '389': 'MK',
  '420': 'CZ',
  '421': 'SK',
  '423': 'LI',
  '501': 'BZ',
  '502': 'GT',
  '503': 'SV',
  '504': 'HN',
  '505': 'NI',
  '506': 'CR',
  '507': 'PA',
  '508': 'PM',
  '509': 'HT',
  '590': 'MF',
  '591': 'BO',
  '592': 'GY',
  '593': 'EC',
  '594': 'GF',
  '595': 'PY',
  '596': 'MQ',
  '597': 'SR',
  '598': 'UY',
  '599': 'CW',
  '673': 'BN',
  '852': 'HK',
  '853': 'MO',
  '855': 'KH',
  '856': 'LA',
  '880': 'BD',
  '886': 'TW',
  '960': 'MV',
  '961': 'LB',
  '962': 'JO',
  '963': 'SY',
  '964': 'IQ',
  '965': 'KW',
  '966': 'SA',
  '967': 'YE',
  '968': 'OM',
  '971': 'AE',
  '972': 'IL',
  '973': 'BH',
  '974': 'QA',
  '975': 'BT',
  '976': 'MN',
  '977': 'NP',
};

const extractCallingCode = (input: string): { code: string | null; national: string } => {
  const s = String(input).trim();
  let norm = s.replace(/[^+\d]/g, '');
  if (norm.startsWith('00')) norm = '+' + norm.slice(2);
  if (norm.startsWith('+')) {
    const digits = norm.slice(1);
    for (const len of [3, 2, 1]) {
      const code = digits.slice(0, len);
      if (CALLING_CODE_TO_ISO[code]) return { code, national: digits.slice(len) };
    }
    return { code: null, national: digits };
  }
  const only = norm.replace(/\D/g, '');
  for (const len of [3, 2, 1]) {
    const code = only.slice(0, len);
    const rest = only.slice(len);
    if (CALLING_CODE_TO_ISO[code] && rest.length >= 6) return { code, national: rest };
  }
  return { code: null, national: only };
};

const formatPhone = (raw: string, iso?: string | null) => {
  const { code, national } = extractCallingCode(raw);
  const cc = code || '';
  const compactNat = national.replace(/\D/g, '');
  const withPlus = cc ? `+${cc}` : '';
  // Country-specific light formatting
  if (cc === '1' && compactNat.length >= 10) {
    const a = compactNat.slice(0, 3), b = compactNat.slice(3, 6), c = compactNat.slice(6, 10);
    return `${withPlus} ${a}-${b}-${c}`;
  }
  if (cc === '91' && compactNat.length >= 10) {
    return `${withPlus} ${compactNat.slice(0, 5)}-${compactNat.slice(5, 10)}`;
  }
  if (cc === '44' && compactNat.length >= 10) {
    return `${withPlus} ${compactNat.slice(0, 4)} ${compactNat.slice(4, 10)}`;
  }
  if (cc) return `${withPlus} ${compactNat}`;
  return raw;
};

const isoToFlag = (iso?: string) => {
  if (!iso) return '';
  const cc = iso.toUpperCase();
  if (cc.length !== 2) return '';
  const A = 0x1F1E6; // Regional Indicator Symbol Letter A
  return String.fromCodePoint(...cc.split('').map(c => A + (c.charCodeAt(0) - 65)));
};

const isoToTwemojiSvgUrl = (iso?: string) => {
  if (!iso) return null;
  const cc = iso.toUpperCase();
  if (cc.length !== 2) return null;
  const A = 0x1F1E6;
  const cps = cc.split('').map((c) => (A + (c.charCodeAt(0) - 65)).toString(16));
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${cps.join('-')}.svg`;
};

const inferIsoFromPhone = (input: string): string | null => {
  const s = String(input).trim();
  // normalize: keep leading + then digits, or treat starting 00 as +
  let norm = s.replace(/[^+\d]/g, '');
  if (norm.startsWith('00')) norm = '+' + norm.slice(2);
  let digits = '';
  if (norm.startsWith('+')) {
    digits = norm.slice(1);
  } else {
    // No explicit + or 00. Try to detect if the start matches a known calling code.
    const onlyDigits = norm.replace(/\D/g, '');
    // Heuristic: try to match 3,2,1-digit calling codes if the remaining length seems like a valid national number (>= 6)
    for (const len of [3, 2, 1]) {
      const code = onlyDigits.slice(0, len);
      const rest = onlyDigits.slice(len);
      if (CALLING_CODE_TO_ISO[code] && rest.length >= 6) return CALLING_CODE_TO_ISO[code];
    }
    return null;
  }
  // try longest prefix first (3, then 2, then 1)
  for (const len of [3, 2, 1]) {
    const code = digits.slice(0, len);
    if (CALLING_CODE_TO_ISO[code]) return CALLING_CODE_TO_ISO[code];
  }
  return null;
};

const PhoneValue: React.FC<FieldValueProps> = ({ value, className, onCommit }) => {
  const initial = String(value ?? '');
  const [editVal, setEditVal] = useState(initial);
  useEffect(() => setEditVal(String(value ?? '')), [value]);
  const v = editVal;

  // Infer ISO from the number only (avoid IP-based fetch due to CORS/rate limits)
  const isoFallback = useMemo(() => inferIsoFromPhone(v) || undefined, [v]);
  const [libIntl, setLibIntl] = useState<string | null>(null);
  const [libIso, setLibIso] = useState<string | null>(null);

  // Try to parse/format using libphonenumber-js when available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { parsePhoneNumberFromString } = await import('libphonenumber-js');
        const options = isoFallback ? { defaultCountry: isoFallback as any } : undefined;
        const pn = parsePhoneNumberFromString(v, options);
        if (pn && mounted) {
          setLibIntl(pn.formatInternational());
          setLibIso(pn.country || null);
          return;
        }
        if (mounted) {
          setLibIntl(null);
          setLibIso(null);
        }
      } catch {
        if (mounted) {
          setLibIntl(null);
          setLibIso(null);
        }
      }
    })();
    return () => { mounted = false; };
  }, [v, isoFallback]);

  const iso = libIso || isoFallback;
  const flag = isoToFlag(iso);
  const flagUrl = isoToTwemojiSvgUrl(iso);
  const memoDisplay = useMemo(() => formatPhone(v, iso), [v, iso]);
  const display = libIntl || memoDisplay;

  // Hover/edit behavior: show input when editing or when hovering outside the link
  const [hovering, setHovering] = useState(false);
  const [hoveringLink, setHoveringLink] = useState(false);
  const [editing, setEditing] = useState(false);

  const hasNumber = String(v ?? '').trim().length > 0;

  return (
    <div
      className={className ? `${className} flex items-center gap-1 w-full justify-start` : 'flex items-center gap-1 w-full justify-start'}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { if (!editing) { setHovering(false); setHoveringLink(false); } }}
      onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
      onClick={(e) => { if (!hoveringLink) { e.stopPropagation(); setEditing(true); } }}
      style={hovering && !editing ? { backgroundColor: '#f3f4f6', borderRadius: '4px', padding: '2px 4px', margin: '-2px -4px' } : {}}
    >
      {(!editing && (!hovering || hoveringLink)) ? (
        hasNumber ? (
          <a
            href={`tel:${v}`}
            className="hover:underline inline-flex items-center gap-1 justify-start truncate"
            style={{ color: '#4F5051', maxWidth: '200px', marginLeft: '4px', marginRight: '4px' }}
            title={display}
            onMouseEnter={() => setHoveringLink(true)}
            onMouseLeave={() => setHoveringLink(false)}
            onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
          >
            {flagUrl ? (
              <img src={flagUrl} alt="" width={16} height={12} className="inline-block align-[-2px] flex-shrink-0" loading="lazy" decoding="async" />
            ) : (
              flag ? <span aria-hidden className="flex-shrink-0">{flag}</span> : null
            )}
            <span className="truncate">{display}</span>
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ) : (
        <div className="flex items-center gap-1 justify-start">
          {flagUrl ? (
            <img src={flagUrl} alt="" width={16} height={12} className="inline-block align-[-2px]" loading="lazy" decoding="async" />
          ) : (
            flag ? <span aria-hidden>{flag}</span> : null
          )}
          <input
            value={editVal}
            onChange={(e) => {
              const newVal = e.target.value;
              const cleaned = newVal.replace(/[^0-9+\-\s()]/g, '');
              setEditVal(cleaned);
            }}
            onFocus={() => setEditing(true)}
            onKeyDown={async (e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                if (onCommit) await onCommit(editVal);
                setEditing(false);
                setHovering(false);
              } else if (e.key === 'Escape') {
                setEditVal(initial);
                setEditing(false);
                setHovering(false);
              }
            }}
            onBlur={async () => {
              if (onCommit && editVal !== initial) await onCommit(editVal);
              setEditing(false);
              setHovering(false);
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="min-w-[120px] bg-white border border-blue-500 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            inputMode="tel"
            placeholder="+1234567890"
          />
        </div>
      )}
    </div>
  );
}
  ;

export default PhoneValue;
