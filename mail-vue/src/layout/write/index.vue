<template>
  <div class="send" v-show="show">
    <div class="write-box">
      <div class="title">
        <div class="title-left">
          <span class="title-text">
            <Icon icon="hugeicons:quill-write-01" width="28" height="28"/>
          </span>
          <span class="sender">{{ $t('sender') }}:</span>
          <span class="sender-name">{{ form.name }}</span>
          <span class="send-email"><{{ form.sendEmail }}></span>
        </div>
        <div @click="close" style="cursor: pointer;">
          <Icon icon="material-symbols-light:close-rounded" width="22" height="22"/>
        </div>
      </div>
      <div class="container">
        <div class="address-panel">
          <el-input-tag
              class="address-input recipient-input"
              @add-tag="value => addTagChange('receiveEmail', value)"
              @input="value => inputChange('receiveEmail', value)"
              @paste.capture="event => handleRecipientPaste('receiveEmail', event)"
              :delimiter="recipientDelimiter"
              clearable
              tag-type="primary"
              size="default"
              v-model="form.receiveEmail"
              :placeholder="$t('recipientPastePlaceholder')"
          >
            <template #prefix>
              <div class="item-title" >{{ $t('recipient') }}</div>
              <el-select
                  ref="mySelect"
                  class="write-select"
                  popper-class="write-select"
                  :show-arrow="false"
                  :no-match-text="' '"
                  :no-data-text="' '"
                  @visible-change="selectStatusChange"
                  @change="selectChange"
              >
                <el-option
                    v-for="item in selectRecipientList"
                    :key="item"
                    :label="item"
                    :value="item"
                    style="color: #999896;"
                />
              </el-select>
            </template>
            <template #suffix>
              <div class="address-actions">
                <button
                    v-if="!showCc && form.cc.length === 0"
                    class="optional-toggle"
                    type="button"
                    @click.stop="showOptionalRecipient('cc')"
                >
                  {{ $t('cc') }}
                </button>
                <button
                    v-if="!showBcc && form.bcc.length === 0"
                    class="optional-toggle"
                    type="button"
                    @click.stop="showOptionalRecipient('bcc')"
                >
                  {{ $t('bcc') }}
                </button>
                <el-tooltip :content="$t('separateSend')" placement="top">
                  <el-button
                      class="separate-send-btn"
                      :type="form.manyType === 'divide' ? 'primary' : 'default'"
                      :plain="form.manyType !== 'divide'"
                      size="small"
                      @click.stop="toggleSeparateSend"
                  >
                    <Icon icon="mdi:email-multiple-outline" width="16" height="16" />
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="$t('selectContacts')" placement="top">
                  <Icon icon="fa7-solid:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts('receiveEmail')" />
                </el-tooltip>
              </div>
            </template>
          </el-input-tag>
          <el-input-tag
              v-if="showCc || form.cc.length > 0"
              class="address-input optional-address-input"
              @add-tag="value => addTagChange('cc', value)"
              @input="value => inputChange('cc', value)"
              @paste.capture="event => handleRecipientPaste('cc', event)"
              :delimiter="recipientDelimiter"
              clearable
              tag-type="success"
              size="default"
              v-model="form.cc"
              :placeholder="$t('ccPastePlaceholder')"
          >
            <template #prefix>
              <div class="item-title" >{{ $t('cc') }}</div>
            </template>
            <template #suffix>
              <div class="address-actions optional-row-actions">
                <el-tooltip :content="$t('selectContacts')" placement="top">
                  <Icon icon="fa7-solid:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts('cc')" />
                </el-tooltip>
                <el-tooltip v-if="form.cc.length === 0" :content="$t('hide')" placement="top">
                  <Icon icon="material-symbols-light:close-rounded" width="20" height="20" class="hide-optional" @click.stop="hideOptionalRecipient('cc')" />
                </el-tooltip>
              </div>
            </template>
          </el-input-tag>
          <el-input-tag
              v-if="showBcc || form.bcc.length > 0"
              class="address-input optional-address-input"
              @add-tag="value => addTagChange('bcc', value)"
              @input="value => inputChange('bcc', value)"
              @paste.capture="event => handleRecipientPaste('bcc', event)"
              :delimiter="recipientDelimiter"
              clearable
              tag-type="warning"
              size="default"
              v-model="form.bcc"
              :placeholder="$t('bccPastePlaceholder')"
          >
            <template #prefix>
              <div class="item-title" >{{ $t('bcc') }}</div>
            </template>
            <template #suffix>
              <div class="address-actions optional-row-actions">
                <el-tooltip :content="$t('selectContacts')" placement="top">
                  <Icon icon="fa7-solid:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts('bcc')" />
                </el-tooltip>
                <el-tooltip v-if="form.bcc.length === 0" :content="$t('hide')" placement="top">
                  <Icon icon="material-symbols-light:close-rounded" width="20" height="20" class="hide-optional" @click.stop="hideOptionalRecipient('bcc')" />
                </el-tooltip>
              </div>
            </template>
          </el-input-tag>
        </div>
        <el-input v-model="form.subject" :placeholder="t('subject')" />
        <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
        <div class="button-item">
          <div class="att-add" @click="chooseFile">
            <Icon icon="iconamoon:attachment-fill" width="24" height="24"/>
          </div>
          <div class="att-clear" @click="clearContent">
            <Icon icon="icon-park-outline:clear-format" width="24" height="24 "/>
          </div>
          <div class="att-list">
            <div class="att-item" v-for="(item,index) in form.attachments" :key="index">
              <Icon v-bind="getIconByName(item.filename)"/>
              <span class="att-filename">{{ item.filename }}</span>
              <span class="att-size">{{ formatBytes(item.size) }}</span>
              <Icon style="cursor: pointer;" icon="material-symbols-light:close-rounded" @click="delAtt(index)"
                    width="22" height="22"/>
            </div>
          </div>
          <div>
            <el-button type="primary" @click="sendEmail" v-if="form.sendType === 'reply'">{{ $t('reply') }}</el-button>
            <el-button type="primary" @click="sendEmail" v-else-if="form.sendType === 'forward'">{{ $t('forward') }}</el-button>
            <el-button type="primary" @click="sendEmail" v-else>{{ $t('send') }}</el-button>
          </div>
        </div>
      </div>
    </div>
    <el-dialog top="10vh" v-model="showContacts" @closed="clearSelectContact" :title="t('recentContacts')">
      <el-table ref="contactsTabRef" row-key="email" :data="contacts" style="height: 445px">
        <el-table-column type="selection" width="32" />
        <el-table-column property="email" :label="t('emailAccount')" >
          <template #default="props">
            <div class="email-row">{{ props.row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column width="55" label="" >
          <template #default>
            <div style="display: flex;">
              <Icon icon="mage:user" style="color: var(--el-text-color-primary)" width="22" height="22" color="#606266" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="contacts-bottom">
        <el-button type="default" @click="deleteContact">{{t('clear')}}</el-button>
        <el-button type="primary" @click="chooseContact">{{t('selectContacts')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import {h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailSend} from "@/request/email.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {fileToBase64, formatBytes} from "@/utils/file-utils.js";
import {getIconByName} from "@/utils/icon-utils.js";
import sendPercent from "@/components/send-percent/index.vue"
import {toOssDomain} from "@/utils/convert.js";
import {formatDetailDate} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {userDraftStore} from "@/store/draft.js";
import {useWriterStore} from "@/store/writer.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import {ElMessageBox} from "element-plus";

defineExpose({
  open,
  openReply,
  openForward,
  openDraft
})

const {t} = useI18n()
const writerStore = useWriterStore();
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref({})
const userStore = useUserStore();
const show = ref(false);
const percent = ref(0)
let percentMessage = null
let sending = false
const defValue = ref('')
const contactsTabRef = ref({})
const showContacts = ref(false)
const mySelect = ref()
let selectStatus = false
const backReply = reactive({
  receiveEmail: [],
  cc: [],
  bcc: [],
  subject: '',
  content: '',
  sendType: '',
  manyType: null
})
const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  cc: [],
  bcc: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  manyType: null,
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

const selectRecipientList = ref([])
const activeRecipientField = ref('receiveEmail')
const showCc = ref(false)
const showBcc = ref(false)
const recipientDelimiter = /[,;，；、\n\r]+/
const recipientFields = ['receiveEmail', 'cc', 'bcc']

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({email: item})))

function showOptionalRecipient(field) {
  if (field === 'cc') showCc.value = true
  if (field === 'bcc') showBcc.value = true
}

function hideOptionalRecipient(field) {
  if (field === 'cc' && form.cc.length === 0) showCc.value = false
  if (field === 'bcc' && form.bcc.length === 0) showBcc.value = false
}

function openContacts(field = 'receiveEmail') {
  showOptionalRecipient(field)
  activeRecipientField.value = field
  showContacts.value = true
  nextTick(() => {
    form[field].forEach(item => {
      if (writerStore.sendRecipientRecord.includes(item)) {
        contactsTabRef.value.toggleRowSelection({email: item});
      }
    })
  })
}

function deleteContact() {
  ElMessageBox.confirm(t('confirmDeletionOfContacts'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
    form[activeRecipientField.value] = form[activeRecipientField.value].filter(item => !contactList.includes(item));
    writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(item => !contactList.includes(item));
  })
}

function chooseContact() {

  const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
  const field = activeRecipientField.value;
  contactList.forEach(item => {
    if (!hasRecipient(item)) {
      form[field].push(item);
    }
  })

  form[field] = form[field].filter(item => {
    return contactList.includes(item) || !writerStore.sendRecipientRecord.includes(item);
  });

  showContacts.value = false
}

function clearSelectContact() {
  contactsTabRef.value.clearSelection();
}

function selectChange(value) {
  appendRecipients('receiveEmail', value)
}

function selectStatusChange(status) {
  selectStatus = status
}

const openSelect = () => {
  mySelect.value.toggleMenu()
}

function inputChange(field, value) {

  if (field !== 'receiveEmail') return

  selectRecipientList.value = writerStore.sendRecipientRecord.filter(item => value && !hasRecipient(item) && item.startsWith(value)).slice(0, 10);

  if (!selectStatus && selectRecipientList.value.length > 0) {
    openSelect()
  }

  if (selectStatus && selectRecipientList.value.length === 0) {
    openSelect()
  }

}

function addTagChange(field, val) {

  const rawValues = normalizeRawValues(val)
  form[field].splice(Math.max(form[field].length - rawValues.length, 0), rawValues.length)
  const {added} = appendRecipients(field, rawValues.join(', '))

  if (selectStatus && field === 'receiveEmail' && added.length > 0) openSelect()
}

function handleRecipientPaste(field, event) {
  const text = event.clipboardData?.getData('text') || ''
  if (!text) return
  const parsed = parseRecipientText(text)
  if (parsed.emails.length === 0 && parsed.invalids.length === 0) return
  event.preventDefault()
  appendRecipients(field, text)
}

function appendRecipients(field, value) {
  const {emails, invalids} = parseRecipientText(value)
  const added = []

  emails.forEach(email => {
    if (!hasRecipient(email)) {
      form[field].push(email)
      added.push(email)
    }
  })

  if (invalids.length > 0) {
    ElMessage({
      message: t('invalidRecipientMsg', {msg: invalids.slice(0, 5).join(', ')}),
      type: 'warning',
      plain: true,
    })
  }

  return {added, invalids}
}

function normalizeRawValues(value) {
  return (Array.isArray(value) ? value : [value])
      .map(item => String(item || '').trim())
      .filter(Boolean)
}

function parseRecipientText(value) {
  const emailPattern = /[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g
  const text = normalizeRawValues(value).join(', ')
  const matched = text.match(emailPattern) || []
  const emails = []
  const seen = new Set()

  matched.forEach(item => {
    const email = item.trim()
    const key = email.toLowerCase()
    if (isEmail(email) && !seen.has(key)) {
      seen.add(key)
      emails.push(email)
    }
  })

  const invalids = text
      .replace(emailPattern, ' ')
      .split(/[\s,;，；、\n\r]+/)
      .map(item => item.replace(/^mailto:/i, '').replace(/^["'<([{]+|[>"')\]}.,!?]+$/g, '').trim())
      .filter(item => item.includes('@') && !isEmail(item))

  return {
    emails,
    invalids: Array.from(new Set(invalids))
  }
}

function hasRecipient(email) {
  const key = String(email || '').toLowerCase()
  return recipientFields.some(field => form[field].some(item => item.toLowerCase() === key))
}

function hasAnyRecipient() {
  return recipientFields.some(field => form[field].length > 0)
}

function sameRecipientList(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function toggleSeparateSend() {
  form.manyType = form.manyType === 'divide' ? null : 'divide'
}

function clearContent() {
  ElMessageBox.confirm(t('clearContentConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    resetForm()
  })

}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = async (e) => {

    const fileList = e.target.files;

    for (const file of fileList) {

      const size = file.size
      const filename = file.name
      const contentType = file.type

      const content = await fileToBase64(file)
      form.attachments.push({content, filename, size, contentType})

    }

  }
}

async function sendEmail() {

  if (form.receiveEmail.length === 0) {
    ElMessage({
      message: t('emptyRecipientMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.subject) {
    ElMessage({
      message: t('emptySubjectMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (!form.content) {
    ElMessage({
      message: t('emptyContentMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.manyType === 'divide' && form.attachments.length > 0) {
    ElMessage({
      message: t('noSeparateSendMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (sending) {
    ElMessage({
      message: t('sendingErrorMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, {value: percent.value, desc: t('sending')}),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending = true

  show.value = false

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(emailList => {
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })

    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', {style: 'color: teal'}, email.subject),
      position: 'bottom-right'
    })

    userStore.refreshUserInfo();

    addRecipientRecord();

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      form.cc = []
      form.bcc = []
      draftStore.setDraft = {...toRaw(form)}
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', {style: 'color: teal'}, e.message),
      position: 'bottom-right'
    })
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percentMessage.close()
    percent.value = 0
    sending = false
  })
}

function addRecipientRecord() {
  const recipients = Array.from(new Set([...form.receiveEmail, ...form.cc, ...form.bcc]))
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(
      email => !recipients.includes(email)
  );

  writerStore.sendRecipientRecord.unshift(...recipients);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}

function resetForm() {
  form.receiveEmail = []
  form.cc = []
  form.bcc = []
  showCc.value = false
  showBcc.value = false
  form.subject = ''
  form.content = ''
  form.manyType = null
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.cc = []
  backReply.bcc = []
  backReply.sendType = ''
  backReply.manyType = null
  editor.value.clearEditor()
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {
  if (selectStatus) openSelect()
}

function openForward(email) {
  resetForm();

  email.subject = email.subject || ''

  form.subject = email.subject
  form.sendType = 'forward'

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
      ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
    `
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = [...form.receiveEmail]
      backReply.cc = [...form.cc]
      backReply.bcc = [...form.bcc]
      backReply.sendType = form.sendType
      backReply.manyType = form.manyType
    })

  });
}

function openReply(email) {

  resetForm();

  email.subject = email.subject || ''

  form.receiveEmail.push(email.sendEmail)
  form.subject = (
      email.subject.startsWith('Re:') ||
      email.subject.startsWith('Re：') ||
      email.subject.startsWith('回复：') ||
      email.subject.startsWith('回复:')) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
    <div></div>
    <div>
    <br>
        ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
      <articl>
          ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
      </article>
    </blockquote>`
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = [...form.receiveEmail]
      backReply.cc = [...form.cc]
      backReply.bcc = [...form.bcc]
      backReply.sendType = form.sendType
      backReply.manyType = form.manyType
    })
  })

}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function open() {
  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  editor.value.focus()
}

function openDraft(draft) {
  Object.assign(form, {...draft})
  form.receiveEmail = Array.isArray(form.receiveEmail) ? form.receiveEmail : []
  form.cc = Array.isArray(form.cc) ? form.cc : []
  form.bcc = Array.isArray(form.bcc) ? form.bcc : []
  showCc.value = form.cc.length > 0
  showBcc.value = form.bcc.length > 0
  form.manyType = form.manyType || null
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  editor.value.focus()
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    close()
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function close() {

  if (selectStatus) openSelect();

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
    show.value = false
    resetForm()
    return;
  }

  if (!(form.content || form.subject || hasAnyRecipient())) {
    show.value = false
    resetForm()
    return;
  }

  if (backReply.sendType === 'reply' || backReply.sendType === 'forward') {
    let subjectFlag = form.subject === backReply.subject
    let contentFlag = editor.value.getContent() === backReply.content
    let receiveFlag = sameRecipientList(form.receiveEmail, backReply.receiveEmail)
    if (backReply.sendType === 'forward' && form.receiveEmail.length === 0) {
      receiveFlag = true;
    }
    const ccFlag = sameRecipientList(form.cc, backReply.cc)
    const bccFlag = sameRecipientList(form.bcc, backReply.bcc)
    const manyFlag = form.manyType === backReply.manyType
    if (subjectFlag && contentFlag && receiveFlag && ccFlag && bccFlag && manyFlag) {
      resetForm();
      close()
      return;
    }
  }

  ElMessageBox.confirm(t('saveDraftConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning',
    distinguishCancelAndClose: true
  }).then(async () => {
    const formData = {...toRaw(form)};
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const draftId = await db.value.draft.add({...formData})
    db.value.att.add({draftId, attachments: toRaw(form.attachments)})
    draftStore.refreshList++
    show.value = false
    await nextTick(() => {
      resetForm()
    })
  }).catch((action) => {
    if (action === 'cancel') {
      show.value = false
      resetForm()
    }
  })

}

</script>
<style>
.write-select .el-select-dropdown__list {
  padding: 4px 4px !important;
}
.write-select .el-select-dropdown__item {
  padding: 0 10px 0 10px;
}

.write-select .el-select-dropdown {
  min-width: 0 !important;
}
</style>
<style scoped lang="scss">
.send {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .write-box {
    background: var(--el-bg-color);
    width: min(1367px, calc(100% - 80px));
    box-shadow: var(--el-box-shadow-light);
    border: 1px solid var(--el-border-color-light);
    transition: var(--el-transition-duration);
    padding: 15px;
    border-radius: 8px;
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    @media (max-width: 1024px) {
      width: 100%;
      height: 100%;
      border-radius: 0;
      border: 0;
      padding-top: 10px;
    }

    @media (min-width: 1025px) {
      height: min(800px, calc(100vh - 60px));
    }

    .title {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      .title-left {
        align-items: center;
        display: grid;
        grid-template-columns: auto auto auto 1fr;
      }

      .title-text {
      }

      .sender {
        margin-left: 8px;
      }

      .sender-name {
        margin-left: 8px;
        font-weight: bold;
      }

      .send-email {
        color: #999896;
        margin-left: 5px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }


      div {
        display: flex;
        align-items: center;
      }
    }

    .container {
      height: 100%;
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 12px;

      .item-title {
        width: 64px;
        color: var(--el-text-color-regular);
        font-size: 14px;
        line-height: 1;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .address-panel {
        display: grid;
        gap: 6px;
      }

      .address-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-right: 3px;
      }

      .optional-toggle {
        border: 0;
        background: transparent;
        color: var(--el-color-primary);
        cursor: pointer;
        font-size: 13px;
        height: 28px;
        padding: 0 3px;
      }

      .optional-toggle:hover {
        color: var(--el-color-primary-light-3);
      }

      .separate-send-btn {
        width: 32px;
        height: 28px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      @media (max-width: 560px) {
        .item-title {
          width: 46px;
        }
      }

      .button-item {
        display: grid;
        grid-template-columns: auto auto 1fr auto;

        .att-add {
          cursor: pointer;
        }

        .att-clear {
          cursor: pointer;
          margin-left: 10px;
        }

        .att-list {
          display: grid;
          gap: 5px;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          padding-left: 10px;
          padding-right: 10px;
          max-height: 110px;
          overflow-y: auto;
          @media (max-width: 450px) {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .att-item {
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            gap: 5px;
            height: 32px;
            font-size: 14px;
            padding: 4px 5px;
            background: var(--light-ill);
            border-radius: 4px;
            .att-filename {
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }
          }
        }
      }
    }
  }

}

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-dialog) {
  width: 420px !important;
  @media (max-width: 460px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.contacts-bottom {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.add-contact {
  color: var(--regular-text-color);
  cursor: pointer;
}

.hide-optional {
  color: var(--regular-text-color);
  cursor: pointer;
}

.optional-row-actions {
  align-items: center;
}

.write-select {
  position: absolute;
  width: 300px;
  left: 72px;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
}

.address-panel {
  .recipient-input {
    min-height: 52px;
    max-height: 150px;
    overflow-y: auto;
    resize: vertical;
  }

  .optional-address-input {
    min-height: 38px;
  }

  :deep(.el-input-tag) {
    width: 100%;
    min-height: 38px;
    align-items: flex-start;
  }

  :deep(.el-input-tag__prefix) {
    align-self: stretch;
    display: flex;
    align-items: center;
  }

  :deep(.el-input-tag__suffix) {
    align-self: stretch;
    display: flex;
    align-items: flex-start;
    padding-top: 4px;
  }

  :deep(.el-input-tag__inner) {
    min-width: 120px;
    align-items: flex-start;
    padding-top: 4px;
  }
}

:deep(.el-input-tag__suffix) {
  padding-right: 4px;
}

.icon {
  cursor: pointer;
}
</style>
