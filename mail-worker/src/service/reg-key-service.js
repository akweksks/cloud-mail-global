import orm from '../entity/orm';
import regKey from '../entity/reg-key';
import { inArray, like, eq, desc, sql, or } from 'drizzle-orm';
import roleService from './role-service';
import BizError from '../error/biz-error';
import { formatDetailDate, toUtc } from '../utils/date-uitil';
import userService from './user-service';
import { t } from '../i18n/i18n.js';

const REG_KEY_BATCH_LIMIT = 500;
const REG_KEY_CODE_LENGTH = 10;
const REG_KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generateRandomCode(length = REG_KEY_CODE_LENGTH) {
	const bytes = new Uint8Array(length);
	if (globalThis.crypto?.getRandomValues) {
		globalThis.crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < length; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}
	}
	return Array.from(bytes, byte => REG_KEY_CHARS[byte % REG_KEY_CHARS.length]).join('');
}

async function generateUniqueCodes(c, total) {
	const codes = [];
	const localSet = new Set();
	let attempts = 0;

	while (codes.length < total) {
		if (attempts > total * 50) {
			throw new BizError(t('regKeyGenerateFail'));
		}

		attempts++;
		const code = generateRandomCode();
		const key = code.toLowerCase();

		if (localSet.has(key)) {
			continue;
		}

		const exists = await orm(c).select().from(regKey).where(eq(regKey.code, code)).get();
		if (exists) {
			continue;
		}

		localSet.add(key);
		codes.push(code);
	}

	return codes;
}

const regKeyService = {

	async add(c, params, userId) {

		let {code,roleId,count,expireTime,mode,batchCount} = params;
		mode = mode === 'batch' ? 'batch' : 'single';

		if (mode === 'single' && !code) {
			throw new BizError(t('emptyRegKey'));
		}

		if (mode === 'single' && !count) {
			throw new BizError(t('regKeyUseCount'));
		}

		if (!expireTime) {
			throw new BizError(t('emptyRegKeyExpire'));
		}

		const roleRow = await roleService.selectById(c, roleId);
		if (!roleRow) {
			throw new BizError(t('roleNotExist'));
		}

		expireTime = formatDetailDate(expireTime)

		if (mode === 'batch') {
			batchCount = Number(batchCount);

			if (!Number.isInteger(batchCount) || batchCount < 1) {
				throw new BizError(t('regKeyUseCount'));
			}

			if (batchCount > REG_KEY_BATCH_LIMIT) {
				throw new BizError(t('regKeyBatchCountLimit', { count: REG_KEY_BATCH_LIMIT }));
			}

			const codes = await generateUniqueCodes(c, batchCount);
			await orm(c).insert(regKey).values(codes.map(code => ({
				code,
				roleId,
				count: 1,
				userId,
				expireTime
			}))).run();

			return { codes };
		}

		code = String(code).trim();
		count = Number(count);

		if (!Number.isInteger(count) || count < 1) {
			throw new BizError(t('regKeyUseCount'));
		}

		const regKeyRow = await orm(c).select().from(regKey).where(eq(regKey.code, code)).get();

		if (regKeyRow) {
			throw new BizError(t('isExistRegKye'));
		}

		await orm(c).insert(regKey).values({code,roleId,count,userId,expireTime}).run();
		return { codes: [code] };
	},

	async delete(c, params) {
		let {regKeyIds} = params;
		regKeyIds = regKeyIds.split(',').map(id => Number(id));
		await orm(c).delete(regKey).where(inArray(regKey.regKeyId,regKeyIds)).run();
	},

	async clearNotUse(c) {
		let now = formatDetailDate(toUtc().tz('Asia/Shanghai').startOf('day'))
		await orm(c).delete(regKey).where(or(eq(regKey.count, 0),sql`datetime(${regKey.expireTime}, '+8 hours') < datetime(${now})`)).run();
	},

	selectByCode(c, code) {
		return orm(c).select().from(regKey).where(eq(regKey.code, code)).get();
	},

	async list(c, params) {

		const {code} = params
		let query = orm(c).select().from(regKey)

		if (code) {
			query = query.where(like(regKey.code, `${code}%`))
		}

		const regKeyList = await query.orderBy(desc(regKey.regKeyId)).all();
		const roleList = await roleService.roleSelectUse(c);

		const today = toUtc().tz('Asia/Shanghai').startOf('day')

		regKeyList.forEach(regKeyRow => {

			const index = roleList.findIndex(roleRow => roleRow.roleId === regKeyRow.roleId)
			regKeyRow.roleName = index > -1 ? (roleList[index].displayName || roleList[index].name) : ''

			const expireTime = toUtc(regKeyRow.expireTime).tz('Asia/Shanghai').startOf('day');

			if (expireTime.isBefore(today)) {
				regKeyRow.expireTime = null
			}
		})

		return regKeyList;
	},

	async reduceCount(c, code, count) {
		await orm(c).update(regKey).set({
			count: sql`${regKey.count}
	  -
	  ${count}`
		}).where(eq(regKey.code, code)).run();
	},

	async history(c, params) {
		const { regKeyId } = params;
		return userService.listByRegKeyId(c, regKeyId);
	}
}

export default regKeyService;
