import { lookup as dnsLookup } from 'node:dns';
import type { LookupFunction } from 'node:net';

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal'];

export function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost' || BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  return isBlockedIpAddress(host);
}

export function isBlockedIpAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  const mapped = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  const ipv4 = mapped ?? (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized) ? normalized : null);

  if (ipv4) {
    const octets = ipv4.split('.').map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
    const [a, b, c] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (!normalized.includes(':')) return false;
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith('ff') || normalized.startsWith('2001:db8:')) return true;
  return false;
}

/**
 * A Node lookup function that rejects every private/non-routable answer before
 * the socket is opened. Checking at lookup time also closes the DNS-rebinding
 * gap left by validating only the URL's hostname.
 */
export const safeLookup: LookupFunction = (hostname, options, callback) => {
  if (isBlockedHostname(hostname)) {
    callback(Object.assign(new Error('Blocked network destination'), { code: 'EHOSTUNREACH' }), '', 0);
    return;
  }

  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error, '', 0);
      return;
    }
    if (!addresses.length || addresses.some(({ address }) => isBlockedIpAddress(address))) {
      callback(Object.assign(new Error('Blocked network destination'), { code: 'EHOSTUNREACH' }), '', 0);
      return;
    }
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  });
};
