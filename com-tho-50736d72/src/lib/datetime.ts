/**
 * Múi giờ thống nhất toàn bộ frontend: Asia/Ho_Chi_Minh (UTC+7).
 * - Hiển thị: formatDateTimeVN / formatTimeVN / formatDateVN
 * - Gửi API LocalDateTime (Spring): toLocalDateTimeStringVN
 */
export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Offset chuẩn cho VN (ghi chú / tài liệu; tính giờ dùng Intl với APP_TIME_ZONE) */
export const APP_TIME_ZONE_OFFSET_LABEL = 'UTC+7';

/**
 * Chuỗi `YYYY-MM-DDTHH:mm:ss` theo đồng hồ tại VN — gửi backend `LocalDateTime`
 * (không nhầm với ISO UTC có hậu tố Z).
 */
export function toLocalDateTimeStringVN(isoOrDate: Date | string | number = new Date()): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const v = (type: Intl.DateTimeFormatPart['type']) =>
    parts.find((p) => p.type === type)?.value ?? '00';
  return `${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v('minute')}:${v('second')}`;
}

export function formatDateTimeVN(isoOrDate: Date | string | number): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatTimeVN(isoOrDate: Date | string | number): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('vi-VN', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDateVN(isoOrDate: Date | string | number): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
