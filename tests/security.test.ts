import { describe, expect, it } from 'vitest';
import { isBlockedHostname, isBlockedIpAddress } from '../src/lib/network-security';
import { safeInternalPath } from '../src/lib/redirects';

describe('network destination validation', () => {
  it.each(['localhost', 'api.localhost', 'printer.local', 'service.internal'])('blocks private hostname %s', (host) => {
    expect(isBlockedHostname(host)).toBe(true);
  });

  it.each(['127.0.0.1', '10.2.3.4', '169.254.169.254', '192.168.1.10', '::1', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1'])(
    'blocks private address %s',
    (address) => expect(isBlockedIpAddress(address)).toBe(true),
  );

  it.each(['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111'])('allows public address %s', (address) => {
    expect(isBlockedIpAddress(address)).toBe(false);
  });
});

describe('safeInternalPath', () => {
  it('keeps internal paths including query strings', () => {
    expect(safeInternalPath('/dashboard/studio?view=growth', '/dashboard')).toBe('/dashboard/studio?view=growth');
  });

  it.each(['https://evil.example', '//evil.example/path', '/\\evil.example', '/dashboard\r\nLocation: https://evil.example'])(
    'rejects unsafe redirect %s',
    (value) => expect(safeInternalPath(value, '/dashboard')).toBe('/dashboard'),
  );
});
