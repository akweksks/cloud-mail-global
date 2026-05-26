import { describe, expect, it } from 'vitest';
import aiService from '../src/service/ai-service.js';
import domainUtils from '../src/utils/domain-uitls.js';
import verifyUtils from '../src/utils/verify-utils.js';
import { settingConst } from '../src/const/entity-const.js';
import i18next from '../src/i18n/i18n.js';
import { applyRoleDisplay } from '../src/service/role-service.js';

describe('worker utility contracts', () => {
	it('validates email addresses and domains', () => {
		expect(verifyUtils.isEmail('admin@example.com')).toBe(true);
		expect(verifyUtils.isEmail('not-an-email')).toBe(false);
		expect(verifyUtils.isDomain('mail.example.com')).toBe(true);
		expect(verifyUtils.isDomain('http://example.com')).toBe(false);
	});

	it('normalizes object storage domains', () => {
		expect(domainUtils.toOssDomain('static.example.com')).toBe('https://static.example.com');
		expect(domainUtils.toOssDomain('https://static.example.com/')).toBe('https://static.example.com');
		expect(domainUtils.toOssDomain('')).toBeNull();
	});

	it('honors AI verification-code sender filters', () => {
		const email = { from: { address: 'security@example.com' } };

		expect(aiService.shouldExtractCode(settingConst.aiCode.CLOSE, '', email)).toBe(false);
		expect(aiService.shouldExtractCode(settingConst.aiCode.OPEN, '', email)).toBe(true);
		expect(aiService.shouldExtractCode(settingConst.aiCode.OPEN, 'example.com', email)).toBe(true);
		expect(aiService.shouldExtractCode(settingConst.aiCode.OPEN, 'security@example.com', email)).toBe(true);
		expect(aiService.shouldExtractCode(settingConst.aiCode.OPEN, 'other.example', email)).toBe(false);
	});

	it('adds localized display fields to built-in roles without changing raw values', async () => {
		await i18next.changeLanguage('zh');

		const role = applyRoleDisplay({
			name: 'Normal user',
			description: 'Basic mailbox permissions'
		});

		expect(role.name).toBe('Normal user');
		expect(role.description).toBe('Basic mailbox permissions');
		expect(role.displayName).toBe('\u666e\u901a\u7528\u6237');
		expect(role.displayDescription).toBe('\u57fa\u7840\u90ae\u7bb1\u6743\u9650');

		await i18next.changeLanguage('en');

		const customRole = applyRoleDisplay({
			name: 'Custom team',
			description: 'Custom description'
		});

		expect(customRole.displayName).toBe('Custom team');
		expect(customRole.displayDescription).toBe('Custom description');
	});
});
