import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import BizError from '../error/biz-error';
import emailService from './email-service';
import { t } from '../i18n/i18n';

dayjs.extend(utc);

const scheduledEmailStatus = {
	PENDING: 0,
	SENT: 1,
	FAILED: 2,
	SENDING: 3
};

function utcNow() {
	return dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
}

function normalizeScheduleTime(value) {
	if (!value) return null;
	const parsed = dayjs.utc(value);
	if (!parsed.isValid()) return null;
	return parsed.format('YYYY-MM-DD HH:mm:ss');
}

function trimMessage(error) {
	return String(error?.message || error || '').slice(0, 1000);
}

const scheduledEmailService = {
	async ensureSchema(c) {
		await c.env.db.batch([
			c.env.db.prepare(`
				CREATE TABLE IF NOT EXISTS scheduled_email (
					schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
					user_id INTEGER NOT NULL,
					account_id INTEGER NOT NULL,
					payload TEXT NOT NULL,
					scheduled_time DATETIME NOT NULL,
					status INTEGER DEFAULT 0 NOT NULL,
					result_email_ids TEXT DEFAULT '' NOT NULL,
					message TEXT DEFAULT '' NOT NULL,
					create_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
					update_time DATETIME
				)
			`),
			c.env.db.prepare(`CREATE INDEX IF NOT EXISTS idx_scheduled_email_due ON scheduled_email(status, scheduled_time)`),
			c.env.db.prepare(`CREATE INDEX IF NOT EXISTS idx_scheduled_email_user ON scheduled_email(user_id, schedule_id)`)
		]);
	},

	async create(c, params, userId) {
		await this.ensureSchema(c);

		const scheduledTime = normalizeScheduleTime(params.scheduledTime);
		if (!scheduledTime) {
			throw new BizError(t('scheduleTimeRequired'));
		}

		if (!dayjs.utc(scheduledTime).isAfter(dayjs().utc())) {
			throw new BizError(t('scheduleTimeFuture'));
		}

		if (!Array.isArray(params.receiveEmail) || params.receiveEmail.length === 0) {
			throw new BizError(t('emptyEmail'));
		}

		if (params.manyType === 'divide' && Array.isArray(params.attachments) && params.attachments.length > 0) {
			throw new BizError(t('noSeparateSendMsg'));
		}

		if (Array.isArray(params.attachments) && params.attachments.length > 0) {
			throw new BizError(t('noScheduledSendAttMsg'));
		}

		const payload = { ...params };
		delete payload.scheduledTime;

		const result = await c.env.db.prepare(`
			INSERT INTO scheduled_email (user_id, account_id, payload, scheduled_time, status)
			VALUES (?, ?, ?, ?, ?)
		`).bind(
			userId,
			Number(payload.accountId || 0),
			JSON.stringify(payload),
			scheduledTime,
			scheduledEmailStatus.PENDING
		).run();

		return {
			scheduleId: result.meta?.last_row_id,
			scheduledTime,
			status: scheduledEmailStatus.PENDING
		};
	},

	async processDue(c, limit = 10) {
		await this.ensureSchema(c);

		const { results = [] } = await c.env.db.prepare(`
			SELECT schedule_id, user_id, payload
			FROM scheduled_email
			WHERE status = ? AND scheduled_time <= ?
			ORDER BY scheduled_time ASC, schedule_id ASC
			LIMIT ?
		`).bind(scheduledEmailStatus.PENDING, utcNow(), limit).all();

		for (const row of results) {
			const claimed = await c.env.db.prepare(`
				UPDATE scheduled_email
				SET status = ?, update_time = CURRENT_TIMESTAMP
				WHERE schedule_id = ? AND status = ?
			`).bind(scheduledEmailStatus.SENDING, row.schedule_id, scheduledEmailStatus.PENDING).run();

			if (claimed.meta?.changes === 0) continue;

			try {
				const payload = JSON.parse(row.payload);
				const sendContext = {
					env: c.env,
					req: {
						url: 'https://scheduled-send.local/'
					}
				};
				const sentRows = await emailService.send(sendContext, payload, row.user_id);
				const emailIds = sentRows.map(item => item.emailId);

				await c.env.db.prepare(`
					UPDATE scheduled_email
					SET status = ?, result_email_ids = ?, message = '', update_time = CURRENT_TIMESTAMP
					WHERE schedule_id = ?
				`).bind(scheduledEmailStatus.SENT, JSON.stringify(emailIds), row.schedule_id).run();
			} catch (error) {
				console.error(`[scheduled-email] failed schedule_id=${row.schedule_id}`, error);
				await c.env.db.prepare(`
					UPDATE scheduled_email
					SET status = ?, message = ?, update_time = CURRENT_TIMESTAMP
					WHERE schedule_id = ?
				`).bind(scheduledEmailStatus.FAILED, trimMessage(error), row.schedule_id).run();
			}
		}

		return results.length;
	}
};

export { scheduledEmailStatus };
export default scheduledEmailService;
