window.__ModuleLoader__.load({
  id: '@local/dsh-ledger-domain',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace owned by this plugin. */
    const NS = 'ledger-domain';
    /** One id addresses both the sidebar row and the main panel. */
    const PANEL_ID = 'ledger-domain';
    /** Host routes owned by this bundle. */
    const API = {
      engine: '/ledger-api/engine',
      engineInstall: '/ledger-api/engine/install',
      setup: '/ledger-api/setup',
      init: '/ledger-api/init',
      bootstrap: '/ledger-api/bootstrap',
      balance: '/ledger-api/balance',
      metadata: '/ledger-api/metadata',
      draftSubmit: '/ledger-api/draft/submit',
      draftUpdate: '/ledger-api/draft/update',
      accountOpen: '/ledger-api/account/open',
      approve: '/ledger-api/draft/approve',
      reject: '/ledger-api/draft/reject',
    };
    const PERIODS = ['none', 'weekly', 'monthly', 'quarterly', 'yearly'];

    const ZH = {
      title: '账本',
      subtitle: 'Python 核心 · 只做展示',
      intro: '账本逻辑在独立的 Python 核心库 ledger_domain 里：别名、对账周期、草稿队列和校验后原子写入都由它完成。这个面板只负责展示，以及把操作转成核心库的 CLI 调用。',
      refresh: '刷新',
      refreshing: '刷新中…',
      loading: '正在读取账本…',
      loadFailed: '读取账本失败',
      retry: '重试',
      path: '根目录',
      today: '今天',
      tabTodo: '待办',
      tabReconcile: '对账',
      tabReview: '审核',
      tabAccounts: '账户',
      reconcileTitle: '待对账',
      reconcileHint: '周期来自账户 open 指令的 reconcile 元数据；到期日从最近一次 Balance 断言重建，不使用本地状态。',
      due: '待办',
      overdue: '逾期',
      scheduled: '未到期',
      allClear: '当前没有到期的账户。',
      noPeriod: '还没有配置对账周期。到「账户」页给资产/负债账户设置周期。',
      lastBalance: '最近断言',
      nextDue: '下次到期',
      period: '周期',
      declareBalance: '申报余额',
      submit: '提交',
      submitting: '提交中…',
      recorded: '已记录 {name} 的余额 {amount} {currency}',
      noAmount: '请填写金额',
      invalidAmount: '金额必须是十进制数字，例如 -32.50',
      mismatch: '余额不一致：账本累计 {accumulated} {currency}，你申报 {expected} {currency}（差异 {difference} {currency}）。未写入任何内容。',
      balanceExists: '该账户当天已经有一条同币种断言。',
      closedAccount: '账户已关闭，无法对账。',
      scheduledTitle: '未到期账户',
      scheduledCount: '{count} 个',
      reviewTitle: '待审核草稿',
      reviewHint: 'AI 草稿由核心库入队，面板只负责审核和调用批准/驳回；校验、锁和写入都在核心库里。',
      pendingEmpty: '审核队列为空。',
      approve: '批准',
      addAccount: '新增账户',
      accountAdded: '已新增账户 {name}',
      accountCanonical: '账户名',
      accountCurrency: '币种',
      accountOpenDate: '开立日期',
      draftPayee: '商户',
      draftNarration: '备注',
      saveDraft: '保存修改',
      draftSaved: '草稿已更新',
      approving: '写入中…',
      reject: '驳回',
      rejecting: '驳回中…',
      rejectReason: '驳回原因（可选）',
      rejectReasonPlaceholder: '例如：不是我的消费',
      issues: '校验问题',
      unresolved: '未分类',
      bindAlias: '把「{name}」记为别名',
      bindAliasLabel: '审核即绑定',
      bindTarget: '绑定到账户',
      bindTargetRequired: '请选择要绑定别名的账户。',
      chooseAccount: '选择账户…',
      postings: '分录',
      confidence: '置信度',
      source: '来源',
      draftId: '草稿',
      approvedAt: '已写入 {file}',
      recentTitle: '最近处理',
      recentEmpty: '还没有处理过的草稿。',
      statusPending: '待审核',
      statusApproved: '已批准',
      statusRejected: '已驳回',
      accountsTitle: '账户与元数据',
      accountsHint: '别名只用于展示和解析，写入 posting 永远使用规范名。周期保存到 open 指令的元数据，修改前会用 bean-check 校验整本账。',
      searchAccounts: '搜索账户或别名',
      accountName: '名称',
      canonical: '规范名',
      alias: '别名',
      aliasPlaceholder: '给这个账户起一个别名',
      save: '保存',
      saving: '保存中…',
      saved: '已保存 {name}',
      clearAlias: '清空别名',
      noAccounts: '没有匹配的账户。',
      notConfigured: '未配置周期',
      implicit: '隐式',
      implicitHint: '该账户由交易自动创建，还没有 open 指令；先在账户文件里补 open，才能维护别名与周期。',
      metadataIssues: '元数据问题',
      metadataIssuesCount: '{count} 项',
      noIssues: '元数据正常',
      quota: '共 {count} 个账户',
      none: '不提醒',
      weekly: '每周',
      monthly: '每月',
      quarterly: '每季度',
      yearly: '每年',
      dismiss: '关闭',
      errorAuth: '登录会话已过期，请刷新页面后重试。',
      errorGeneric: '操作失败',
      errorBeanCheck: 'bean-check 拒绝了这个变更：',
      errorAliasConflict: '别名冲突：',
      errorUnavailable: '无法执行 Python 核心库。检查插件配置里的 corePath / pythonPath。',
      errorCore: '核心库调用失败：',
      engineTitle: '准备账本引擎',
      engineIntro: '这笔账本需要一个本地账本引擎。若系统已有 Python 3.11+，点一次安装即可；之后不再需要终端或手动装依赖。',
      enginePath: '引擎位置',
      engineInstall: '安装 / 修复账本引擎',
      engineInstalling: '正在准备引擎，首次可能需要几分钟…',
      engineLog: '安装日志',
      engineMissing: '账本引擎尚未安装',
      engineStaleHint: '核心库有更新或引擎不完整；点一次修复即可。',
      engineError: '引擎操作失败：',
      errorEngine: '引擎操作失败：',
      setupTitle: '创建你的第一个账本',
      setupIntro: '账本是一组纯文本文件，放在你选择的文件夹里。创建后会自动生成账户模板、当前年度账本和备份说明。',
      setupPath: '账本位置',
      setupName: '账本名称',
      setupCurrency: '主币种',
      setupCreate: '创建账本',
      setupCreating: '正在创建…',
      setupCreated: '账本已创建：{title}',
      setupNotEmpty: '这个文件夹不是空的。为了不覆盖已有文件，初始化只会写入空文件夹；请把插件配置的 root 指向一个空目录。',
      setupHint: '创建后可在「审核」页手动记第一笔，或接入 AI 账单提案。',
      setupNameRequired: '请填写账本名称。',
      setupExists: '这个位置已经有账本了，刷新即可打开。',
      manualEntry: '记一笔',
      entryTitle: '手动记一笔',
      entryHint: '保存后进入审核队列；只有点击批准才会写入账本。',
      entryType: '类型',
      entryExpense: '支出',
      entryIncome: '收入',
      entryDate: '日期',
      entryPayee: '商户 / 对方',
      entryAmount: '金额',
      entryCategory: '分类',
      entrySource: '账户',
      entryNarration: '备注（可选）',
      entrySave: '保存草稿',
      entrySaving: '保存中…',
      entryCancel: '取消',
      entryQueued: '已加入审核队列：{payee} {amount} {currency}',
      entryInvalidAmount: '金额必须是正数，例如 38.00',
      entryMissing: '请选择分类和账户',
      entryNoAccounts: '还没有可用的账户；先到「账户」页设置别名或新建科目。',
      entrySameAccount: '分类和账户不能相同。',
      entryChooseCategory: '选择分类…',
      entryChooseSource: '选择账户…',
      errorDraftNotPending: '该草稿已经处理过了。',
      errorUnresolved: '还有未分类的分录，请先选择账户。',
      emptyDraft: '没有可显示的分录。',
      total: '合计',
      bindFailed: '绑定别名失败：',
      bindWrittenApproveFailed: '别名已写入，但批准失败：{error}',
      approvedWritten: '已批准并写入 {file}',
      approvedExisting: '该草稿已在账本中，无需重复写入。',
      rejectedNotice: '已驳回 {id}',
      closed: '已关闭',
      currency: '币种',
      issueUnresolved: '未分类分录',
      issueUnbalanced: '分录不平衡',
      issueBeforeOpen: '账户在交易日期之后才开立',
      issueClosed: '账户在交易日期已关闭',
      issueFuture: '交易日期在未来',
      errorInvalidCurrency: '币种 {currency} 不在该账户的 open 声明中（允许：{allowed}）',
      errorAccountNotOpened: '该账户由交易隐式创建，先补 open 指令才能维护别名或周期。',
      errorInvalidAlias: '别名不合法：{message}',
      errorInvalidAccount: '账户名不合法。',
      errorFutureDate: '日期不能在未来。',
      errorInvalidPeriod: '对账周期不合法。',
      errorUnbalanced: '分录不平衡。',
      unknown: '未知',
    };

    const EN = {
      title: 'Ledger',
      subtitle: 'Python core · display only',
      intro: 'The ledger logic lives in the separate Python core library ledger_domain: aliases, reconciliation periods, the draft queue, and validated atomic writes. This panel only displays the state and turns actions into CLI calls to the core.',
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      loading: 'Reading the ledger…',
      loadFailed: 'Could not read the ledger',
      retry: 'Retry',
      path: 'Root',
      today: 'Today',
      tabTodo: 'To do',
      tabReconcile: 'Reconcile',
      tabReview: 'Review',
      tabAccounts: 'Accounts',
      reconcileTitle: 'Due for reconciliation',
      reconcileHint: 'The period comes from the account open directive; the due date rebuilds from the latest balance assertion, with no local state.',
      due: 'Due',
      overdue: 'Overdue',
      scheduled: 'Scheduled',
      allClear: 'No account is due right now.',
      noPeriod: 'No reconciliation period is configured yet. Set one for asset and liability accounts on the Accounts tab.',
      lastBalance: 'Last assertion',
      nextDue: 'Next due',
      period: 'Period',
      declareBalance: 'Declared balance',
      submit: 'Submit',
      submitting: 'Submitting…',
      recorded: 'Recorded {amount} {currency} for {name}',
      noAmount: 'Enter an amount',
      invalidAmount: 'Use a decimal amount, for example -32.50',
      mismatch: 'Balance mismatch: the ledger accumulates {accumulated} {currency}, you declared {expected} {currency} (difference {difference} {currency}). Nothing was written.',
      balanceExists: 'This account already has an assertion for that date and currency.',
      closedAccount: 'The account is closed and cannot be reconciled.',
      scheduledTitle: 'Scheduled accounts',
      scheduledCount: '{count}',
      reviewTitle: 'Pending drafts',
      reviewHint: 'The core queues AI drafts. The panel only reviews them and calls approve or reject; validation, locking and writes all happen in the core.',
      pendingEmpty: 'The review queue is empty.',
      approve: 'Approve',
      addAccount: 'Add account',
      accountAdded: 'Account {name} added',
      accountCanonical: 'Account name',
      accountCurrency: 'Currency',
      accountOpenDate: 'Open date',
      draftPayee: 'Payee',
      draftNarration: 'Narration',
      saveDraft: 'Save changes',
      draftSaved: 'Draft updated',
      approving: 'Writing…',
      reject: 'Reject',
      rejecting: 'Rejecting…',
      rejectReason: 'Reason (optional)',
      rejectReasonPlaceholder: 'For example: not my purchase',
      issues: 'Issues',
      unresolved: 'Unclassified',
      bindAlias: 'Bind "{name}" as an alias',
      bindAliasLabel: 'Bind on review',
      bindTarget: 'Bind to account',
      bindTargetRequired: 'Choose the account that should receive the alias.',
      chooseAccount: 'Choose an account…',
      postings: 'Postings',
      confidence: 'Confidence',
      source: 'Source',
      draftId: 'Draft',
      approvedAt: 'Written to {file}',
      recentTitle: 'Recently handled',
      recentEmpty: 'No draft has been handled yet.',
      statusPending: 'Pending',
      statusApproved: 'Approved',
      statusRejected: 'Rejected',
      accountsTitle: 'Accounts and metadata',
      accountsHint: 'Aliases are used for display and resolution only; postings always use canonical names. Periods are stored as open-directive metadata and every change is bean-checked before writing.',
      searchAccounts: 'Search account or alias',
      accountName: 'Name',
      canonical: 'Canonical',
      alias: 'Alias',
      aliasPlaceholder: 'Give this account an alias',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved {name}',
      clearAlias: 'Clear alias',
      noAccounts: 'No account matches.',
      notConfigured: 'No period',
      implicit: 'Implicit',
      implicitHint: 'Created by transactions without an open directive; add one to the account file before governing its alias or period.',
      metadataIssues: 'Metadata issues',
      metadataIssuesCount: '{count}',
      noIssues: 'Metadata is clean',
      quota: '{count} accounts',
      none: 'Off',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      dismiss: 'Dismiss',
      errorAuth: 'The session expired. Refresh the page and try again.',
      errorGeneric: 'The operation failed',
      errorBeanCheck: 'bean-check rejected this change: ',
      errorAliasConflict: 'Alias conflict: ',
      errorUnavailable: 'Cannot run the Python core. Check corePath / pythonPath in the plugin config.',
      errorCore: 'The core call failed: ',
      engineTitle: 'Prepare the ledger engine',
      engineIntro: 'This ledger needs a local engine. With Python 3.11+ already on the system, install it once; no terminal or manual dependency setup afterwards.',
      enginePath: 'Engine location',
      engineInstall: 'Install / repair engine',
      engineInstalling: 'Preparing the engine; the first run can take a few minutes…',
      engineLog: 'Install log',
      engineMissing: 'The ledger engine is not installed yet',
      engineStaleHint: 'The core changed or the engine is incomplete; run one repair.',
      engineError: 'Engine operation failed: ',
      errorEngine: 'Engine operation failed: ',
      setupTitle: 'Create your first ledger',
      setupIntro: 'A ledger is a folder of plain-text files. Creating one generates a starter account tree, the current year and a backup note.',
      setupPath: 'Ledger location',
      setupName: 'Ledger name',
      setupCurrency: 'Main currency',
      setupCreate: 'Create ledger',
      setupCreating: 'Creating…',
      setupCreated: 'Ledger created: {title}',
      setupNotEmpty: 'This folder is not empty. To avoid overwriting anything, initialization only writes into an empty folder; point the plugin root at an empty directory.',
      setupHint: 'Then record your first entry on the Review tab, or connect an AI bill proposer.',
      setupNameRequired: 'Enter a ledger name.',
      setupExists: 'A ledger already exists here; refresh to open it.',
      manualEntry: 'Record entry',
      entryTitle: 'Record an entry',
      entryHint: 'Saving adds a draft to the review queue; nothing is written to the ledger until you approve it.',
      entryType: 'Type',
      entryExpense: 'Expense',
      entryIncome: 'Income',
      entryDate: 'Date',
      entryPayee: 'Merchant / counterparty',
      entryAmount: 'Amount',
      entryCategory: 'Category',
      entrySource: 'Account',
      entryNarration: 'Note (optional)',
      entrySave: 'Save draft',
      entrySaving: 'Saving…',
      entryCancel: 'Cancel',
      entryQueued: 'Added to the review queue: {payee} {amount} {currency}',
      entryInvalidAmount: 'Enter a positive amount, for example 38.00',
      entryMissing: 'Choose a category and an account',
      entryNoAccounts: 'No usable account yet; set aliases or add accounts on the Accounts tab.',
      entrySameAccount: 'The category and the account must differ.',
      entryChooseCategory: 'Choose a category…',
      entryChooseSource: 'Choose an account…',
      errorDraftNotPending: 'This draft was already handled.',
      errorUnresolved: 'Some postings are still unclassified. Choose an account first.',
      emptyDraft: 'No posting to show.',
      total: 'Total',
      bindFailed: 'Binding the alias failed: ',
      bindWrittenApproveFailed: 'The alias was written, but approval failed: {error}',
      approvedWritten: 'Approved and written to {file}',
      approvedExisting: 'This draft is already in the ledger; nothing was written again.',
      rejectedNotice: 'Rejected {id}',
      closed: 'Closed',
      currency: 'Currency',
      issueUnresolved: 'Unclassified posting',
      issueUnbalanced: 'Unbalanced postings',
      issueBeforeOpen: 'Account opens after the transaction date',
      issueClosed: 'Account is closed on the transaction date',
      issueFuture: 'Transaction date is in the future',
      errorInvalidCurrency: 'Currency {currency} is not declared by this account\'s open directive (allowed: {allowed})',
      errorAccountNotOpened: 'This account exists only through transactions; add an open directive before governing its alias or period.',
      errorInvalidAlias: 'Invalid alias: {message}',
      errorInvalidAccount: 'Invalid account name.',
      errorFutureDate: 'The date cannot be in the future.',
      errorInvalidPeriod: 'Invalid reconciliation period.',
      errorUnbalanced: 'The postings are not balanced.',
      unknown: 'unknown',
    };

    const STATUS_STYLE = {
      overdue: { color: 'var(--dsw-alias-state-error-primary)', background: 'color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent)' },
      due: { color: 'var(--dsw-alias-state-warn-primary)', background: 'color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent)' },
      scheduled: { color: 'var(--dsw-alias-label-secondary)', background: 'var(--dsw-alias-bg-layer-2)' },
      pending: { color: 'var(--dsw-alias-state-business-primary)', background: 'color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)' },
      approved: { color: 'var(--dsw-alias-state-success-primary)', background: 'color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent)' },
      rejected: { color: 'var(--dsw-alias-label-secondary)', background: 'var(--dsw-alias-bg-layer-2)' },
    };

    const S = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflow: 'auto',
        background: 'var(--dsw-alias-bg-base)',
      },
      inner: { padding: '24px 28px 48px', display: 'grid', gap: 16, maxWidth: 1180, width: '100%', boxSizing: 'border-box' },
      head: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
      mark: { display: 'inline-flex', color: 'var(--dsw-alias-brand-primary)' },
      headText: { display: 'grid', gap: 2, minWidth: 0 },
      title: { margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--dsw-alias-label-primary)', lineHeight: 1.3 },
      subtitle: { margin: 0, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
      headMeta: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
      meta: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      intro: { margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--dsw-alias-label-secondary)' },
      tabs: { display: 'flex', gap: 4, borderBottom: '1px solid var(--dsw-alias-border-l1)', alignItems: 'flex-end' },
      tab: {
        appearance: 'none',
        background: 'transparent',
        border: 0,
        borderBottom: '2px solid transparent',
        padding: '8px 10px 9px',
        font: 'inherit',
        fontSize: 13,
        color: 'var(--dsw-alias-label-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      },
      tabActive: { color: 'var(--dsw-alias-label-primary)', borderBottomColor: 'var(--dsw-alias-brand-primary)', fontWeight: 600 },
      count: {
        fontSize: 11,
        lineHeight: '16px',
        minWidth: 16,
        textAlign: 'center',
        padding: '0 5px',
        borderRadius: 8,
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-label-secondary)',
        fontVariantNumeric: 'tabular-nums',
      },
      panel: { display: 'grid', gap: 12 },
      sectionHead: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
      sectionTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' },
      hint: { margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
      card: {
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-layer-1)',
        padding: '14px 16px',
        display: 'grid',
        gap: 10,
      },
      row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
      spread: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' },
      grow: { flex: '1 1 220px', minWidth: 0 },
      name: { fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary)', overflow: 'hidden', textOverflow: 'ellipsis' },
      canonical: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', overflowWrap: 'anywhere' },
      label: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
      value: { fontSize: 13, color: 'var(--dsw-alias-label-primary)', fontVariantNumeric: 'tabular-nums' },
      badge: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, lineHeight: '18px', padding: '0 7px', borderRadius: 9, whiteSpace: 'nowrap' },
      button: {
        appearance: 'none',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-base)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 7,
        padding: '6px 11px',
        font: 'inherit',
        fontSize: 12,
        lineHeight: '18px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      },
      buttonPrimary: {
        border: '1px solid transparent',
        background: 'var(--dsw-alias-brand-primary)',
        // `brand-primary-invert` equals `brand-primary` in the shell theme, so a
        // brand surface must take its text from the inverted label token.
        color: 'var(--dsw-alias-label-primary-inverted, #fff)',
        fontWeight: 600,
      },
      buttonDanger: { borderColor: 'var(--dsw-alias-state-error-primary)', color: 'var(--dsw-alias-state-error-primary)' },
      buttonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
      input: {
        boxSizing: 'border-box',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-base)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 7,
        padding: '6px 8px',
        font: 'inherit',
        fontSize: 12,
        lineHeight: '18px',
        minWidth: 0,
      },
      amountInput: { width: 120, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
      currencySelect: { width: 88 },
      select: {
        boxSizing: 'border-box',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-base)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 7,
        padding: '6px 8px',
        font: 'inherit',
        fontSize: 12,
        lineHeight: '18px',
      },
      alert: {
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 9,
        padding: '9px 12px',
        fontSize: 12,
        lineHeight: 1.6,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      },
      alertError: { borderColor: 'var(--dsw-alias-state-error-primary)', color: 'var(--dsw-alias-state-error-primary)', background: 'color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent)' },
      alertSuccess: { borderColor: 'var(--dsw-alias-state-success-primary)', color: 'var(--dsw-alias-state-success-primary)', background: 'color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent)' },
      alertInfo: { color: 'var(--dsw-alias-label-secondary)' },
      empty: {
        border: '1px dashed var(--dsw-alias-border-l2)',
        borderRadius: 10,
        padding: '22px 16px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--dsw-alias-label-secondary)',
      },
      table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
      th: { textAlign: 'left', padding: '7px 8px', color: 'var(--dsw-alias-label-secondary)', fontWeight: 500, borderBottom: '1px solid var(--dsw-alias-border-l1)', whiteSpace: 'nowrap' },
      td: { padding: '8px', borderBottom: '1px solid var(--dsw-alias-border-l1)', verticalAlign: 'middle' },
      tableScroll: { overflowX: 'auto' },
      postings: { display: 'grid', gap: 4, margin: 0, padding: '8px 0 0', listStyle: 'none' },
      posting: { display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 },
      issue: { fontSize: 12, lineHeight: 1.55, color: 'var(--dsw-alias-state-warn-primary)' },
      issueBlocking: { color: 'var(--dsw-alias-state-error-primary)' },
      details: { borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: 8 },
      summary: { cursor: 'pointer', fontSize: 12, color: 'var(--dsw-alias-label-secondary)', display: 'flex', gap: 8, alignItems: 'center' },
      binding: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '8px 10px', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)' },
      checkbox: { width: 14, height: 14, accentColor: 'var(--dsw-alias-brand-primary)' },
      mono: { fontFamily: 'var(--ds-font-family-code, ui-monospace, monospace)', fontSize: 11 },
      spacer: { height: 2 },
    };

    /** Replace `{name}` tokens in a dictionary string. */
    function fill(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (match, key) => (values && Object.hasOwn(values, key) ? String(values[key]) : match));
    }

    /** Locale service captured by `apply`; components read it through `useT`. */
    let localeService = {
      bind: () => (key) => key,
      subscribe: () => () => {},
      getLocale: () => ({ id: 'zh' }),
    };

    /** A tiny `t` hook that re-renders when the locale preference changes. */
    function useT() {
      const [revision, setRevision] = React.useState(0);
      React.useEffect(() => localeService.subscribe(() => setRevision((value) => value + 1)), []);
      return React.useMemo(() => localeService.bind(NS), [revision]);
    }

    function Glyph({ size = 18, active = false }) {
      return h(
        'svg',
        {
          viewBox: '0 0 36 36',
          width: size,
          height: size,
          'aria-hidden': true,
          style: { display: 'block', flex: 'none', color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)' },
        },
        h('path', {
          d: 'M9 6.5h13.5a2 2 0 0 1 2 2v21l-3.2-2-3.3 2-3.3-2-3.2 2-3.5-2V8.5a2 2 0 0 1 2-2Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinejoin: 'round',
        }),
        h('path', { d: 'M12 12h8M12 16.5h8M12 21h5', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
        h('circle', { cx: 26.5, cy: 25.5, r: 4.2, fill: 'var(--dsw-alias-state-success-primary)' }),
        h('path', { d: 'm24.7 25.6 1.2 1.2 2.1-2.4', fill: 'none', stroke: 'var(--dsw-alias-bg-base)', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function Button({ children, onClick, disabled = false, variant = 'outline', busy = false, title }) {
      const style = {
        ...S.button,
        ...(variant === 'primary' ? S.buttonPrimary : null),
        ...(variant === 'danger' ? S.buttonDanger : null),
        ...(disabled || busy ? S.buttonDisabled : null),
      };
      return h(
        'button',
        { type: 'button', style, disabled: disabled || busy, onClick, title },
        busy ? h('span', { style: { opacity: 0.8 } }, children) : children,
      );
    }

    function Badge({ tone, children }) {
      return h('span', { style: { ...S.badge, ...(STATUS_STYLE[tone] ?? STATUS_STYLE.scheduled) } }, children);
    }

    function Field({ label, children }) {
      return h(
        'label',
        { style: { display: 'grid', gap: 4, minWidth: 0 } },
        h('span', { style: S.label }, label),
        children,
      );
    }

    function formatMoney(amount, currency) {
      return `${amount} ${currency}`;
    }

    function statusLabel(t, status) {
      return t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}`);
    }

    function periodLabel(t, period) {
      return period && PERIODS.includes(period) ? t(period) : t('notConfigured');
    }

    /** Localized label for one domain issue, with the detail appended. */
    function issueText(t, issue) {
      const keys = {
        unresolved_account: 'issueUnresolved',
        unbalanced: 'issueUnbalanced',
        before_account_open: 'issueBeforeOpen',
        closed_account: 'issueClosed',
        future_dated: 'issueFuture',
      };
      const key = keys[issue.code];
      return `${key ? t(key) : issue.code}: ${issue.message}`;
    }

    async function fetchJson(path, init) {
      const response = await fetch(path, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...init,
      });
      let payload;
      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }
      if (payload && payload.ok === false) {
        const error = payload.error ?? {};
        const failure = new Error(error.message ? String(error.message) : String(error.code ?? 'request_failed'));
        failure.code = error.code ? String(error.code) : `HTTP_${response.status}`;
        failure.details = error.details ?? {};
        throw failure;
      }
      if (!response.ok || payload === undefined) {
        const failure = new Error(`HTTP ${response.status}`);
        failure.code = `HTTP_${response.status}`;
        throw failure;
      }
      return payload;
    }

    function postJson(path, body) {
      return fetchJson(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    /**
     * Panel root. Defined inside `apply` so it closes over the Client context,
     * locale service and tab-scoped editor state without extra injection.
     */
    function LedgerPanel() {
      const t = useT();
      const [engine, setEngine] = React.useState(null);
      const [engineBusy, setEngineBusy] = React.useState(false);
      const [engineLog, setEngineLog] = React.useState('');
      const [engineError, setEngineError] = React.useState(null);
      const [setup, setSetup] = React.useState(null);
      const [setupForm, setSetupForm] = React.useState({ title: '我的账本', currency: 'CNY' });
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [loadError, setLoadError] = React.useState(null);
      const [notice, setNotice] = React.useState(null);
      const [actionError, setActionError] = React.useState(null);
      const [tab, setTab] = React.useState('todo');
      const [busy, setBusy] = React.useState(null);
      const [balanceInputs, setBalanceInputs] = React.useState({});
      const [draftEdits, setDraftEdits] = React.useState({});
      const [bindChecks, setBindChecks] = React.useState({});
      const [bindTargets, setBindTargets] = React.useState({});
      const [rejectReasons, setRejectReasons] = React.useState({});
      const [accountQuery, setAccountQuery] = React.useState('');
      const [accountEdits, setAccountEdits] = React.useState({});
      const [draftMeta, setDraftMeta] = React.useState({});
      const [newAccountOpen, setNewAccountOpen] = React.useState(false);
      const [newAccount, setNewAccount] = React.useState({ account: 'Assets:Savings:Bank:', currency: 'CNY', alias: '', date: '', reconcile: 'none' });
      const [entryOpen, setEntryOpen] = React.useState(false);
      const [entry, setEntry] = React.useState({
        kind: 'expense',
        date: '',
        payee: '',
        amount: '',
        category: '',
        source: '',
        narration: '',
      });
      const generation = React.useRef(0);
      const busyRef = React.useRef(null);
      const alertRef = React.useRef(null);

      const load = React.useCallback(async () => {
        const request = ++generation.current;
        setLoading(true);
        setLoadError(null);
        try {
          const enginePayload = await fetchJson(API.engine);
          if (request !== generation.current) return;
          setEngine(enginePayload);
          if (enginePayload.ready !== true) {
            setData(null);
            return;
          }
          const setupPayload = await fetchJson(API.setup);
          if (request !== generation.current) return;
          setSetup(setupPayload);
          if (setupPayload.initialized !== true) {
            setData(null);
            return;
          }
          const payload = await fetchJson(API.bootstrap);
          if (request !== generation.current) return;
          setData(payload);
        } catch (failure) {
          if (request !== generation.current) return;
          setLoadError(describeFailure(t, failure));
        } finally {
          if (request === generation.current) setLoading(false);
        }
      }, [t]);

      React.useEffect(() => {
        void load();
        return () => {
          generation.current += 1;
        };
      }, [load]);

      React.useEffect(() => {
        if (actionError !== null) alertRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, [actionError]);

      /** Replace both banners: one message at a time, never an error under a stale success. */
      function reportError(message) {
        setNotice(null);
        setActionError(message);
      }

      const runAction = React.useCallback(
        async (key, action, successMessage) => {
          if (busyRef.current !== null) return;
          busyRef.current = key;
          setBusy(key);
          setActionError(null);
          setNotice(null);
          try {
            const returned = await action();
            setNotice(typeof returned === 'string' ? returned : successMessage);
            await load();
          } catch (failure) {
            setNotice(null);
            setActionError(describeFailure(t, failure));
          } finally {
            busyRef.current = null;
            setBusy(null);
          }
        },
        [load, t],
      );

      const accounts = data?.accounts ?? [];
      const openAccounts = React.useMemo(
        () => accounts.filter((account) => !account.closed).slice().sort((left, right) => left.name.localeCompare(right.name)),
        [accounts],
      );
      // Binding writes metadata, which an implicit (auto-created) account has no
      // open directive to carry. Keep those out of the bind target list.
      const metadataAccounts = React.useMemo(() => openAccounts.filter((account) => !account.implicit), [openAccounts]);
      // Manual entry only uses explicit accounts: an implicit account has no
      // open directive and cannot carry the alias/reconcile metadata the UI
      // would later want to attach.
      const entryAccounts = metadataAccounts;
      const expenseCategories = React.useMemo(
        () => entryAccounts.filter((account) => account.account.startsWith('Expenses:')),
        [entryAccounts],
      );
      const incomeCategories = React.useMemo(
        () => entryAccounts.filter((account) => account.account.startsWith('Income:')),
        [entryAccounts],
      );
      const assetSources = React.useMemo(
        () => entryAccounts.filter((account) => account.account.startsWith('Assets:')),
        [entryAccounts],
      );
      const liabilitySources = React.useMemo(
        () => entryAccounts.filter((account) => account.account.startsWith('Liabilities:')),
        [entryAccounts],
      );
      const today = data?.today ?? setup?.today ?? '';
      const ledgerCurrency = data?.operatingCurrency ?? 'CNY';
      const reconciliationAccounts = React.useMemo(
        () => accounts.filter((account) => account.period && account.period !== 'none' && !account.closed),
        [accounts],
      );
      const dueAccounts = reconciliationAccounts
        .filter((account) => account.status === 'due' || account.status === 'overdue')
        .sort((left, right) => (left.status === right.status ? left.nextDue.localeCompare(right.nextDue) : left.status === 'overdue' ? -1 : 1));
      const scheduledAccounts = reconciliationAccounts.filter((account) => account.status === 'scheduled');
      const pendingDrafts = data?.pendingDrafts ?? [];
      const recentDrafts = data?.recentDrafts ?? [];
      const filteredAccounts = React.useMemo(() => {
        const query = accountQuery.trim().toLowerCase();
        const list = query === ''
          ? accounts
          : accounts.filter((account) => `${account.name} ${account.account}`.toLowerCase().includes(query));
        return list.slice(0, 200);
      }, [accounts, accountQuery]);

      const currencyOptions = React.useMemo(() => {
        const values = new Set();
        for (const account of accounts) for (const currency of account.currencies) values.add(currency);
        if (data?.operatingCurrency) values.add(data.operatingCurrency);
        for (const currency of ['CNY', 'USD', 'COIN']) values.add(currency);
        return [...values].sort();
      }, [accounts, data]);

      const tabRows = [
        { id: 'todo', label: t('tabTodo'), count: dueAccounts.length + pendingDrafts.length },
        { id: 'accounts', label: t('tabAccounts'), count: null },
      ];

      const entryCategoryOptions = entry.kind === 'expense' ? expenseCategories : incomeCategories;
      const entrySourceOptions = entry.kind === 'expense'
        ? [...assetSources, ...liabilitySources].sort((left, right) => left.name.localeCompare(right.name))
        : assetSources;

      const aliasesByDraft = React.useMemo(() => {
        const map = {};
        for (const draft of pendingDrafts) {
          const unresolved = draft.postings.filter((posting) => posting.account === null);
          if (unresolved.length > 0) {
            const candidate = draft.payee !== '' ? draft.payee : draft.narration;
            map[draft.id] = candidate;
          }
        }
        return map;
      }, [pendingDrafts]);

      function inputFor(account) {
        return balanceInputs[account.account] ?? {
          amount: '',
          currency: account.currencies[0] ?? data?.operatingCurrency ?? 'CNY',
        };
      }

      function updateInput(account, patch) {
        const current = inputFor(account);
        setBalanceInputs((previous) => ({ ...previous, [account.account]: { ...current, ...patch } }));
      }

      function submitBalance(account) {
        const input = inputFor(account);
        if (input.amount.trim() === '') {
          reportError(t('noAmount'));
          return;
        }
        void runAction(`balance:${account.account}`, async () => {
          await postJson(API.balance, { account: account.name, amount: input.amount.trim(), currency: input.currency });
          return fill(t('recorded'), { name: account.name, amount: input.amount.trim(), currency: input.currency });
        }, '');
      }

      function editPosting(draft, index, accountName) {
        setDraftEdits((previous) => {
          const current = previous[draft.id] ?? draft.postings.map((posting) => ({ ...posting }));
          const next = current.slice();
          next[index] = { ...next[index], account: accountName === '' ? null : accountName };
          return { ...previous, [draft.id]: next };
        });
        if (accountName !== '') {
          // The bind target follows the posting's account on every change: a
          // stale target would write the merchant alias to a different account
          // than the one the transaction posts to.
          setBindTargets((previous) => ({ ...previous, [draft.id]: accountName }));
        }
      }

      function postingsFor(draft) {
        return draftEdits[draft.id] ?? draft.postings;
      }

      function metaFor(draft) {
        return draftMeta[draft.id] ?? { payee: draft.payee ?? '', narration: draft.narration ?? '' };
      }

      function saveDraftMeta(draft) {
        const meta = metaFor(draft);
        const postings = postingsFor(draft);
        if (postings.some((posting) => posting.account === null)) {
          reportError(t('errorUnresolved'));
          return;
        }
        void runAction(`draft-meta:${draft.id}`, async () => {
          await postJson(API.draftUpdate, {
            id: draft.id,
            payee: meta.payee,
            narration: meta.narration,
            postings,
          });
          return t('draftSaved');
        }, '');
      }

      function createAccount() {
        const account = newAccount.account.trim();
        if (account === '') {
          reportError(t('accountCanonical'));
          return;
        }
        const payload = {
          account,
          currency: newAccount.currency || ledgerCurrency,
          date: newAccount.date || today,
        };
        if (newAccount.alias.trim() !== '') payload.alias = newAccount.alias.trim();
        if (newAccount.reconcile !== 'none') payload.reconcile = newAccount.reconcile;
        void runAction('account-open', async () => {
          await postJson(API.accountOpen, payload);
          setNewAccountOpen(false);
          return fill(t('accountAdded'), { name: account });
        }, '');
      }

      function approveDraft(draft) {
        const postings = postingsFor(draft);
        if (postings.some((posting) => posting.account === null)) {
          reportError(t('errorUnresolved'));
          return;
        }
        const bind = bindChecks[draft.id] === true;
        const target = bindTargets[draft.id] ?? '';
        const alias = aliasesByDraft[draft.id] ?? '';
        if (bind && (target === '' || alias.trim() === '')) {
          reportError(t('bindTargetRequired'));
          return;
        }
        void runAction(`approve:${draft.id}`, async () => {
          let aliasWritten = false;
          if (bind) {
            try {
              await postJson(API.metadata, { account: target, alias: alias.trim() });
              aliasWritten = true;
            } catch (failure) {
              const described = describeFailure(t, failure);
              failure.handled = true;
              failure.message = `${t('bindFailed')}${described}`;
              throw failure;
            }
          }
          try {
            const response = await postJson(API.approve, { id: draft.id, postings });
            return response.committed
              ? fill(t('approvedWritten'), { file: response.draft?.approved?.file ?? '' })
              : t('approvedExisting');
          } catch (failure) {
            if (aliasWritten) {
              const described = describeFailure(t, failure);
              failure.handled = true;
              failure.message = fill(t('bindWrittenApproveFailed'), { error: described });
            }
            throw failure;
          }
        }, '');
      }

      function rejectDraft(draft) {
        void runAction(`reject:${draft.id}`, async () => {
          await postJson(API.reject, { id: draft.id, reason: rejectReasons[draft.id] ?? '' });
          return fill(t('rejectedNotice'), { id: draft.id });
        }, '');
      }

      function saveAccount(account) {
        const edit = accountEdits[account.account] ?? { alias: account.alias ?? '', period: account.period ?? 'none' };
        const body = { account: account.account };
        let changed = false;
        // Only write what the user actually edited: an alias-only save must not
        // add a `reconcile: "none"` line to an account that had no period.
        if (edit.period !== (account.period ?? 'none')) {
          body.reconcile = edit.period;
          changed = true;
        }
        const alias = edit.alias.trim();
        if (alias !== (account.alias ?? '')) {
          if (alias === '') body.clear_alias = true;
          else body.alias = alias;
          changed = true;
        }
        if (!changed) {
          setActionError(null);
          setNotice(fill(t('saved'), { name: account.name }));
          return;
        }
        void runAction(`account:${account.account}`, async () => {
          await postJson(API.metadata, body);
          return fill(t('saved'), { name: account.name });
        }, '');
      }

      function clearAlias(account) {
        void runAction(`account:${account.account}`, async () => {
          await postJson(API.metadata, { account: account.account, clear_alias: true });
          return fill(t('saved'), { name: account.name });
        }, '');
      }

      async function installEngine() {
        if (engineBusy) return;
        setEngineBusy(true);
        setEngineError(null);
        setEngineLog('');
        try {
          const force = engine?.kind === 'stale' || engine?.kind === 'broken';
          const response = await postJson(API.engineInstall, { force });
          setEngineLog(typeof response.log === 'string' ? response.log : '');
          await load();
        } catch (failure) {
          setEngineError(describeFailure(t, failure));
          if (typeof failure?.details?.log === 'string') setEngineLog(failure.details.log);
        } finally {
          setEngineBusy(false);
        }
      }

      function createLedger() {
        const title = setupForm.title.trim();
        if (title === '') {
          reportError(t('setupNameRequired'));
          return;
        }
        void runAction('init', async () => {
          await postJson(API.init, { title, currency: setupForm.currency });
          return fill(t('setupCreated'), { title });
        }, '');
      }

      function openEntry() {
        setEntry({ kind: 'expense', date: today, payee: '', amount: '', category: '', source: '', narration: '' });
        setEntryOpen(true);
        setTab('review');
      }

      function updateEntry(patch) {
        setEntry((previous) => ({ ...previous, ...patch }));
      }

      function saveEntry() {
        const amount = entry.amount.trim();
        if (!/^(?:0|[1-9]\d{0,14})(?:\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
          reportError(t('entryInvalidAmount'));
          return;
        }
        if (entry.category === '' || entry.source === '') {
          reportError(t('entryMissing'));
          return;
        }
        if (entry.category === entry.source) {
          reportError(t('entrySameAccount'));
          return;
        }
        const payee = entry.payee.trim() || entry.category;
        const narration = entry.narration.trim() || payee;
        const postings = entry.kind === 'expense'
          ? [
              { account: entry.category, amount, currency: ledgerCurrency },
              { account: entry.source, amount: `-${amount}`, currency: ledgerCurrency },
            ]
          : [
              { account: entry.source, amount, currency: ledgerCurrency },
              { account: entry.category, amount: `-${amount}`, currency: ledgerCurrency },
            ];
        void runAction('entry', async () => {
          await postJson(API.draftSubmit, {
            date: entry.date || today,
            payee,
            narration,
            postings,
            source: { kind: 'manual', ref: '' },
            confidence: 1,
          });
          setEntryOpen(false);
          return fill(t('entryQueued'), { payee, amount, currency: ledgerCurrency });
        }, '');
      }

      function updateAccountEdit(account, patch) {
        const current = accountEdits[account.account] ?? { alias: account.alias ?? '', period: account.period ?? 'none' };
        setAccountEdits((previous) => ({ ...previous, [account.account]: { ...current, ...patch } }));
      }

      const header = h(
        'header',
        { style: S.head },
        h('span', { style: S.mark }, h(Glyph, { size: 28 })),
        h(
          'div',
          { style: S.headText },
          h('h1', { style: S.title }, t('title')),
          h('p', { style: S.subtitle }, t('subtitle')),
        ),
        h(
          'div',
          { style: S.headMeta },
          (data?.root ?? setup?.root) ? h('span', { style: S.meta, title: data?.root ?? setup?.root }, `${t('path')}: ${data?.root ?? setup?.root}`) : null,
          (data?.today ?? setup?.today) ? h('span', { style: S.meta }, `${t('today')}: ${data?.today ?? setup?.today}`) : null,
          data ? h(Button, { variant: 'primary', onClick: openEntry, disabled: busy !== null }, t('manualEntry')) : null,
          h(Button, { onClick: () => { void load(); }, busy: loading, disabled: busy !== null, variant: 'outline' }, loading ? t('refreshing') : t('refresh')),
        ),
      );

      let body;
      let showTabs = false;
      if (engine !== null && engine.ready !== true) {
        body = renderEngineSetup();
      } else if (setup !== null && setup.initialized === false) {
        body = renderOnboarding();
      } else if (loadError !== null && data === null) {
        body = h(
          'div',
          { style: S.empty },
          h('div', { style: { marginBottom: 10 } }, `${t('loadFailed')}: ${loadError}`),
          h(Button, { onClick: () => { void load(); }, variant: 'primary' }, t('retry')),
        );
      } else if (data === null) {
        body = h('div', { style: S.empty }, t('loading'));
      } else {
        showTabs = true;
        if (tab === 'accounts') body = renderAccounts();
        else body = h('div', { style: { display: 'grid', gap: 16 } }, renderReconcile(), renderReview());
      }

      return h(
        'div',
        { style: S.root },
        h(
          'div',
          { style: S.inner },
          header,
          h('p', { style: S.intro }, t('intro')),
          loadError !== null && (data !== null || setup?.initialized === false || (engine !== null && engine.ready !== true))
            ? h(
                'div',
                { style: { ...S.alert, ...S.alertError }, role: 'alert' },
                h('span', null, `${t('loadFailed')}: ${loadError}`),
                h(Button, { onClick: () => { void load(); }, busy: loading, variant: 'outline' }, loading ? t('refreshing') : t('retry')),
              )
            : null,
          actionError !== null
            ? h(
                'div',
                { ref: alertRef, style: { ...S.alert, ...S.alertError }, role: 'alert' },
                h('span', null, actionError),
                h(Button, { onClick: () => setActionError(null) }, t('dismiss')),
              )
            : null,
          notice !== null
            ? h(
                'div',
                { style: { ...S.alert, ...S.alertSuccess }, role: 'status' },
                h('span', null, notice),
                h(Button, { onClick: () => setNotice(null) }, t('dismiss')),
              )
            : null,
          showTabs
            ? h(
                'nav',
                { style: S.tabs },
                tabRows.map((row) =>
                  h(
                    'button',
                    {
                      key: row.id,
                      type: 'button',
                      style: { ...S.tab, ...(tab === row.id ? S.tabActive : null) },
                      onClick: () => setTab(row.id),
                      'aria-current': tab === row.id ? 'page' : undefined,
                    },
                    row.label,
                    row.count !== null && row.count > 0 ? h('span', { style: S.count }, String(row.count)) : null,
                  ),
                ),
              )
            : null,
          body,
        ),
      );

      function renderReconcile() {
        const rows = [];
        for (const account of dueAccounts) {
          const input = inputFor(account);
          const key = `balance:${account.account}`;
          rows.push(
            h(
              'div',
              { key: account.account, style: S.card },
              h(
                'div',
                { style: S.spread },
                h(
                  'div',
                  { style: S.grow },
                  h('div', { style: S.name }, account.name),
                  account.alias ? h('div', { style: S.canonical }, account.account) : null,
                  h(
                    'div',
                    { style: { ...S.row, marginTop: 4 } },
                    h(Badge, { tone: account.status }, account.status === 'overdue' ? t('overdue') : t('due')),
                    h('span', { style: S.label }, `${t('period')}: ${periodLabel(t, account.period)}`),
                    h('span', { style: S.label }, `${t('lastBalance')}: ${account.lastBalance ? formatMoney(account.lastBalance.amount, account.lastBalance.currency) : '—'}`),
                    h('span', { style: S.label }, `${t('nextDue')}: ${account.nextDue ?? '—'}`),
                  ),
                ),
                h(
                  'div',
                  { style: S.row },
                  h(
                    'input',
                    {
                      style: { ...S.input, ...S.amountInput },
                      inputMode: 'decimal',
                      placeholder: '0.00',
                      disabled: busy !== null,
                      'aria-label': `${t('declareBalance')} ${account.name}`,
                      value: input.amount,
                      onChange: (event) => updateInput(account, { amount: event.target.value }),
                    },
                  ),
                  h(
                    'select',
                    {
                      style: { ...S.select, ...S.currencySelect },
                      disabled: busy !== null,
                      'aria-label': `${account.name} ${t('currency')}`,
                      value: input.currency,
                      onChange: (event) => updateInput(account, { currency: event.target.value }),
                    },
                    (account.currencies.length > 0 ? account.currencies : currencyOptions).map((currency) =>
                      h('option', { key: currency, value: currency }, currency),
                    ),
                  ),
                  h(Button, { variant: 'primary', onClick: () => submitBalance(account), busy: busy === key, disabled: busy !== null }, busy === key ? t('submitting') : t('submit')),
                ),
              ),
            ),
          );
        }
        return h(
          'section',
          { style: S.panel },
          h(
            'div',
            { style: S.spread },
            h(
              'div',
              null,
              h('h2', { style: S.sectionTitle }, t('reconcileTitle')),
              h('p', { style: S.hint }, t('reconcileHint')),
            ),
            h('span', { style: S.label }, `${dueAccounts.length} ${t('due')} · ${dueAccounts.filter((account) => account.status === 'overdue').length} ${t('overdue')}`),
          ),
          dueAccounts.length === 0
            ? h('div', { style: S.empty }, reconciliationAccounts.length === 0 ? t('noPeriod') : t('allClear'))
            : h('div', { style: { display: 'grid', gap: 10 } }, rows),
          scheduledAccounts.length > 0
            ? h(
                'details',
                { style: S.details },
                h('summary', { style: S.summary }, `${t('scheduledTitle')} (${scheduledAccounts.length})`),
                h(
                  'div',
                  { style: { ...S.tableScroll, marginTop: 8 } },
                  h(
                    'table',
                    { style: S.table },
                    h(
                      'thead',
                      null,
                      h(
                        'tr',
                        null,
                        h('th', { style: S.th }, t('accountName')),
                        h('th', { style: S.th }, t('period')),
                        h('th', { style: S.th }, t('lastBalance')),
                        h('th', { style: S.th }, t('nextDue')),
                      ),
                    ),
                    h(
                      'tbody',
                      null,
                      scheduledAccounts.map((account) =>
                        h(
                          'tr',
                          { key: account.account },
                          h('td', { style: S.td }, account.name),
                          h('td', { style: S.td }, periodLabel(t, account.period)),
                          h('td', { style: S.td }, account.lastBalance ? formatMoney(account.lastBalance.amount, account.lastBalance.currency) : '—'),
                          h('td', { style: S.td }, account.nextDue ?? '—'),
                        ),
                      ),
                    ),
                  ),
                ),
              )
            : null,
          data.issues.length > 0 ? renderIssues() : null,
        );
      }

      function renderReview() {
        const cards = pendingDrafts.map((draft) => {
          const postings = postingsFor(draft);
          const hasUnresolved = postings.some((posting) => posting.account === null);
          const originallyUnresolved = draft.postings.some((posting) => posting.account === null);
          const blocking = draft.issues.filter((issue) => {
            if (issue.code === 'unresolved_account') return hasUnresolved;
            return ['unbalanced', 'before_account_open', 'closed_account'].includes(issue.code);
          });
          return h(
            'div',
            { key: draft.id, style: S.card },
            h(
              'div',
              { style: S.spread },
              h(
                'div',
                { style: S.grow },
                h('div', { style: S.name }, `${draft.date} · ${draft.payee || draft.narration}`),
                h('div', { style: S.canonical }, `${t('draftId')}: ${draft.id}${draft.source?.kind ? ` · ${t('source')}: ${draft.source.kind}` : ''}${typeof draft.confidence === 'number' ? ` · ${t('confidence')}: ${Math.round(draft.confidence * 100)}%` : ''}`),
              ),
              h(Badge, { tone: 'pending' }, t('statusPending')),
            ),
            h(
              'div',
              { style: { ...S.row, gap: 6, flexWrap: 'wrap' } },
              h('input', {
                style: { ...S.input, width: 220 },
                placeholder: t('draftPayee'),
                'aria-label': `${t('draftPayee')} ${draft.id}`,
                disabled: busy !== null,
                value: metaFor(draft).payee,
                onChange: (event) => setDraftMeta((previous) => ({ ...previous, [draft.id]: { ...metaFor(draft), payee: event.target.value } })),
              }),
              h('input', {
                style: { ...S.input, width: 260 },
                placeholder: t('draftNarration'),
                'aria-label': `${t('draftNarration')} ${draft.id}`,
                disabled: busy !== null,
                value: metaFor(draft).narration,
                onChange: (event) => setDraftMeta((previous) => ({ ...previous, [draft.id]: { ...metaFor(draft), narration: event.target.value } })),
              }),
              h(
                Button,
                {
                  variant: 'outline',
                  onClick: () => saveDraftMeta(draft),
                  busy: busy === `draft-meta:${draft.id}`,
                  disabled: busy !== null || hasUnresolved,
                },
                busy === `draft-meta:${draft.id}` ? t('saving') : t('saveDraft'),
              ),
            ),
            h(
              'ul',
              { style: S.postings },
              postings.map((posting, index) =>
                h(
                  'li',
                  { key: `${draft.id}-${index}`, style: S.posting },
                  h(
                    'span',
                    { style: { ...S.value, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                    draft.postings[index]?.account === null
                      ? h(
                          'select',
                          {
                            style: S.select,
                            disabled: busy !== null,
                            value: posting.account ?? '',
                            'aria-label': `${t('chooseAccount')} ${index + 1}`,
                            onChange: (event) => editPosting(draft, index, event.target.value),
                          },
                          h('option', { value: '' }, `${t('unresolved')}: ${posting.suggested || '—'}`),
                          openAccounts.map((account) => h('option', { key: account.account, value: account.name }, account.name)),
                        )
                      : h('span', null, posting.account),
                  ),
                  h('span', { style: S.mono }, formatMoney(posting.amount, posting.currency)),
                ),
              ),
            ),
            blocking.length > 0
              ? h(
                  'div',
                  { style: { display: 'grid', gap: 2 } },
                  h('span', { style: S.label }, t('issues')),
                  blocking.map((issue, index) => h('span', { key: index, style: { ...S.issue, ...S.issueBlocking } }, issueText(t, issue))),
                )
              : null,
            originallyUnresolved
              ? h(
                  'div',
                  { style: S.binding },
                  h(
                    'label',
                    { style: { ...S.row, gap: 6, fontSize: 12 } },
                    h('input', {
                      type: 'checkbox',
                      style: S.checkbox,
                      disabled: busy !== null,
                      checked: bindChecks[draft.id] === true,
                      onChange: (event) => setBindChecks((previous) => ({ ...previous, [draft.id]: event.target.checked })),
                    }),
                    t('bindAliasLabel'),
                    h('span', { style: S.label }, fill(t('bindAlias'), { name: aliasesByDraft[draft.id] || t('unknown') })),
                  ),
                  h(
                    'select',
                    {
                      style: S.select,
                      disabled: busy !== null,
                      value: bindTargets[draft.id] ?? '',
                      'aria-label': t('bindTarget'),
                      onChange: (event) => setBindTargets((previous) => ({ ...previous, [draft.id]: event.target.value })),
                    },
                    h('option', { value: '' }, t('bindTarget')),
                    metadataAccounts.map((account) => h('option', { key: account.account, value: account.name }, account.name)),
                  ),
                )
              : null,
            h(
              'div',
              { style: S.spread },
              h(
                'div',
                { style: S.row },
                h(
                  'input',
                  {
                    style: { ...S.input, width: 220 },
                    placeholder: t('rejectReasonPlaceholder'),
                    'aria-label': t('rejectReason'),
                    disabled: busy !== null,
                    value: rejectReasons[draft.id] ?? '',
                    onChange: (event) => setRejectReasons((previous) => ({ ...previous, [draft.id]: event.target.value })),
                  },
                ),
                h(Button, { variant: 'danger', onClick: () => rejectDraft(draft), busy: busy === `reject:${draft.id}`, disabled: busy !== null }, busy === `reject:${draft.id}` ? t('rejecting') : t('reject')),
              ),
              h(
                Button,
                {
                  variant: 'primary',
                  onClick: () => approveDraft(draft),
                  busy: busy === `approve:${draft.id}`,
                  disabled: blocking.length > 0 || hasUnresolved || busy !== null,
                },
                busy === `approve:${draft.id}` ? t('approving') : t('approve'),
              ),
            ),
          );
        });
        return h(
          'section',
          { style: S.panel },
          h(
            'div',
            null,
            h('h2', { style: S.sectionTitle }, t('reviewTitle')),
            h('p', { style: S.hint }, t('reviewHint')),
          ),
          entryOpen ? renderEntryForm() : null,
          pendingDrafts.length === 0 ? h('div', { style: S.empty }, t('pendingEmpty')) : h('div', { style: { display: 'grid', gap: 10 } }, cards),
          recentDrafts.length > 0
            ? h(
                'details',
                { style: S.details },
                h('summary', { style: S.summary }, `${t('recentTitle')} (${recentDrafts.length})`),
                h(
                  'div',
                  { style: { display: 'grid', gap: 6, marginTop: 8 } },
                  recentDrafts.map((draft) =>
                    h(
                      'div',
                      { key: draft.id, style: { ...S.row, justifyContent: 'space-between', fontSize: 12 } },
                      h('span', { style: S.value }, `${draft.date} · ${draft.payee || draft.narration}`),
                      h(
                        'span',
                        { style: { ...S.row, gap: 8 } },
                        draft.approved?.file ? h('span', { style: S.label }, fill(t('approvedAt'), { file: draft.approved.file })) : null,
                        h(Badge, { tone: draft.status }, statusLabel(t, draft.status)),
                      ),
                    ),
                  ),
                ),
              )
            : null,
        );
      }

      function renderAccounts() {
        return h(
          'section',
          { style: S.panel },
          h(
            'div',
            { style: S.spread },
            h(
              'div',
              null,
              h('h2', { style: S.sectionTitle }, t('accountsTitle')),
              h('p', { style: S.hint }, t('accountsHint')),
            ),
            h('span', { style: S.label }, fill(t('quota'), { count: accounts.length })),
          ),
          h(
            'div',
            { style: S.row },
            h(
              Button,
              { variant: 'outline', onClick: () => setNewAccountOpen((value) => !value), disabled: busy !== null },
              t('addAccount'),
            ),
          ),
          newAccountOpen
            ? h(
                'div',
                { style: { ...S.card, display: 'grid', gap: 8 } },
                h(
                  'div',
                  { style: { ...S.row, gap: 6, flexWrap: 'wrap' } },
                  h('input', {
                    style: { ...S.input, width: 320 },
                    placeholder: 'Assets:Savings:Bank:Ningbo',
                    'aria-label': t('accountCanonical'),
                    disabled: busy !== null,
                    value: newAccount.account,
                    onChange: (event) => setNewAccount((previous) => ({ ...previous, account: event.target.value })),
                  }),
                  h('input', {
                    style: { ...S.input, width: 160 },
                    placeholder: t('aliasPlaceholder'),
                    'aria-label': t('alias'),
                    disabled: busy !== null,
                    value: newAccount.alias,
                    onChange: (event) => setNewAccount((previous) => ({ ...previous, alias: event.target.value })),
                  }),
                  h(
                    'select',
                    {
                      style: S.select,
                      'aria-label': t('accountCurrency'),
                      disabled: busy !== null,
                      value: newAccount.currency,
                      onChange: (event) => setNewAccount((previous) => ({ ...previous, currency: event.target.value })),
                    },
                    currencyOptions.map((currency) => h('option', { key: currency, value: currency }, currency)),
                  ),
                  h('input', {
                    type: 'date',
                    style: { ...S.input, width: 150 },
                    'aria-label': t('accountOpenDate'),
                    max: today,
                    disabled: busy !== null,
                    value: newAccount.date || today,
                    onChange: (event) => setNewAccount((previous) => ({ ...previous, date: event.target.value })),
                  }),
                  h(
                    'select',
                    {
                      style: S.select,
                      'aria-label': t('period'),
                      disabled: busy !== null,
                      value: newAccount.reconcile,
                      onChange: (event) => setNewAccount((previous) => ({ ...previous, reconcile: event.target.value })),
                    },
                    PERIODS.map((period) => h('option', { key: period, value: period }, periodLabel(t, period))),
                  ),
                  h(
                    Button,
                    { variant: 'primary', onClick: createAccount, busy: busy === 'account-open', disabled: busy !== null },
                    busy === 'account-open' ? t('saving') : t('save'),
                  ),
                ),
              )
            : null,
          h(
            'div',
            { style: S.row },
            h('input', {
              style: { ...S.input, width: 260 },
              placeholder: t('searchAccounts'),
              'aria-label': t('searchAccounts'),
              value: accountQuery,
              onChange: (event) => setAccountQuery(event.target.value),
            }),
            data.issues.length > 0 ? h(Badge, { tone: 'due' }, `${t('metadataIssues')} ${fill(t('metadataIssuesCount'), { count: data.issues.length })}`) : h(Badge, { tone: 'approved' }, t('noIssues')),
          ),
          data.issues.length > 0
            ? h(
                'div',
                { style: { display: 'grid', gap: 4 } },
                data.issues.slice(0, 8).map((issue, index) => h('div', { key: index, style: { ...S.issue, fontSize: 12 } }, issueText(t, issue))),
              )
            : null,
          filteredAccounts.length === 0
            ? h('div', { style: S.empty }, t('noAccounts'))
            : h(
                'div',
                { style: S.tableScroll },
                h(
                  'table',
                  { style: S.table },
                  h(
                    'thead',
                    null,
                    h(
                      'tr',
                      null,
                      h('th', { style: S.th }, t('accountName')),
                      h('th', { style: S.th }, t('period')),
                      h('th', { style: S.th }, t('alias')),
                      h('th', { style: S.th }, t('nextDue')),
                      h('th', { style: S.th }, ''),
                    ),
                  ),
                  h(
                    'tbody',
                    null,
                    filteredAccounts.map((account) => {
                      const edit = accountEdits[account.account] ?? { alias: account.alias ?? '', period: account.period ?? 'none' };
                      const implicit = account.implicit === true;
                      return h(
                        'tr',
                        { key: account.account },
                        h(
                          'td',
                          { style: S.td },
                          h(
                            'div',
                            { style: { ...S.row, gap: 6 } },
                            h('span', { style: S.name }, account.name),
                            implicit ? h(Badge, { tone: 'scheduled' }, t('implicit')) : null,
                            account.closed ? h(Badge, { tone: 'rejected' }, t('closed')) : null,
                          ),
                          account.alias ? h('div', { style: S.canonical }, account.account) : null,
                          implicit ? h('div', { style: { ...S.label, marginTop: 2 } }, t('implicitHint')) : null,
                        ),
                        h(
                          'td',
                          { style: S.td },
                          h(
                            'select',
                            {
                              style: { ...S.select, opacity: implicit ? 0.55 : 1 },
                              value: edit.period,
                              disabled: implicit || busy !== null,
                              'aria-label': `${t('period')} ${account.name}`,
                              onChange: (event) => updateAccountEdit(account, { period: event.target.value }),
                            },
                            PERIODS.map((period) => h('option', { key: period, value: period }, periodLabel(t, period))),
                          ),
                        ),
                        h(
                          'td',
                          { style: S.td },
                          h('input', {
                            style: { ...S.input, width: 170, opacity: implicit ? 0.55 : 1 },
                            placeholder: t('aliasPlaceholder'),
                            maxLength: 40,
                            disabled: implicit || busy !== null,
                            'aria-label': `${t('alias')} ${account.name}`,
                            value: edit.alias,
                            onChange: (event) => updateAccountEdit(account, { alias: event.target.value }),
                          }),
                        ),
                        h(
                          'td',
                          { style: S.td },
                          account.nextDue === null
                            ? h('span', { style: S.label }, '—')
                            : h(
                                'span',
                                { style: { ...S.row, gap: 6 } },
                                h('span', { style: S.value }, account.nextDue),
                                account.status ? h(Badge, { tone: account.status }, statusLabel(t, account.status)) : null,
                              ),
                        ),
                        h(
                          'td',
                          { style: S.td },
                          h(
                            'div',
                            { style: { ...S.row, gap: 6 } },
                            account.alias && !implicit
                              ? h(Button, { onClick: () => clearAlias(account), disabled: busy !== null }, t('clearAlias'))
                              : null,
                            h(
                              Button,
                              {
                                variant: 'primary',
                                onClick: () => saveAccount(account),
                                busy: busy === `account:${account.account}`,
                                disabled: implicit || busy !== null,
                              },
                              busy === `account:${account.account}` ? t('saving') : t('save'),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ),
        );
      }

      function renderEngineSetup() {
        const stale = engine?.kind === 'stale' || engine?.kind === 'broken';
        return h(
          'section',
          { style: S.panel },
          h(
            'div',
            { style: S.card },
            h('h2', { style: S.sectionTitle }, t('engineTitle')),
            h('p', { style: S.hint }, t('engineIntro')),
            stale ? h('p', { style: S.hint }, t('engineStaleHint')) : null,
            h(
              'div',
              { style: { display: 'grid', gap: 4 } },
              h('span', { style: S.label }, t('enginePath')),
              h('span', { style: { ...S.canonical, fontSize: 12, overflowWrap: 'anywhere' } }, engine?.engineDir ?? ''),
            ),
            engineError !== null
              ? h(
                  'div',
                  { style: { ...S.alert, ...S.alertError }, role: 'alert' },
                  h('span', null, engineError),
                )
              : null,
            engineLog !== ''
              ? h(
                  'details',
                  { style: S.details },
                  h('summary', { style: S.summary }, t('engineLog')),
                  h(
                    'pre',
                    { style: { ...S.mono, margin: '8px 0 0', maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap' } },
                    engineLog,
                  ),
                )
              : null,
            h(
              'div',
              { style: S.row },
              h(
                Button,
                { variant: 'primary', onClick: installEngine, busy: engineBusy, disabled: engineBusy },
                engineBusy ? t('engineInstalling') : t('engineInstall'),
              ),
            ),
          ),
        );
      }

      function renderOnboarding() {
        return h(
          'section',
          { style: S.panel },
          h(
            'div',
            { style: S.card },
            h('h2', { style: S.sectionTitle }, t('setupTitle')),
            h('p', { style: S.hint }, t('setupIntro')),
            setup?.hasEntries
              ? h(
                  'div',
                  { style: { ...S.alert, ...S.alertError }, role: 'alert' },
                  h('span', null, t('setupNotEmpty')),
                )
              : null,
            h(
              'div',
              { style: S.row },
              h(
                Field,
                { label: t('setupName') },
                h('input', {
                  style: { ...S.input, width: 260 },
                  maxLength: 80,
                  disabled: busy !== null,
                  value: setupForm.title,
                  onChange: (event) => setSetupForm((previous) => ({ ...previous, title: event.target.value })),
                }),
              ),
              h(
                Field,
                { label: t('setupCurrency') },
                h(
                  'select',
                  {
                    style: { ...S.select, width: 120 },
                    disabled: busy !== null,
                    value: setupForm.currency,
                    onChange: (event) => setSetupForm((previous) => ({ ...previous, currency: event.target.value })),
                  },
                  ['CNY', 'USD', 'EUR', 'HKD', 'JPY'].map((currency) => h('option', { key: currency, value: currency }, currency)),
                ),
              ),
            ),
            h(
              'div',
              { style: { display: 'grid', gap: 4 } },
              h('span', { style: S.label }, t('setupPath')),
              h('span', { style: { ...S.canonical, fontSize: 12, overflowWrap: 'anywhere' } }, setup?.root ?? ''),
            ),
            h(
              'div',
              { style: S.row },
              h(
                Button,
                { variant: 'primary', onClick: createLedger, busy: busy === 'init', disabled: busy !== null },
                busy === 'init' ? t('setupCreating') : t('setupCreate'),
              ),
            ),
            h('p', { style: S.hint }, t('setupHint')),
          ),
        );
      }

      function renderEntryForm() {
        const noAccounts = entryCategoryOptions.length === 0 || entrySourceOptions.length === 0;
        return h(
          'div',
          { style: S.card },
          h('h3', { style: { ...S.sectionTitle, fontSize: 13 } }, t('entryTitle')),
          h('p', { style: S.hint }, t('entryHint')),
          h(
            'div',
            { style: S.row },
            h(
              Field,
              { label: t('entryType') },
              h(
                'select',
                {
                  style: S.select,
                  disabled: busy !== null,
                  value: entry.kind,
                  onChange: (event) => updateEntry({ kind: event.target.value, category: '', source: '' }),
                },
                h('option', { value: 'expense' }, t('entryExpense')),
                h('option', { value: 'income' }, t('entryIncome')),
              ),
            ),
            h(
              Field,
              { label: t('entryDate') },
              h('input', {
                type: 'date',
                style: S.input,
                max: today,
                disabled: busy !== null,
                value: entry.date,
                onChange: (event) => updateEntry({ date: event.target.value }),
              }),
            ),
            h(
              Field,
              { label: t('entryPayee') },
              h('input', {
                style: { ...S.input, width: 180 },
                disabled: busy !== null,
                value: entry.payee,
                onChange: (event) => updateEntry({ payee: event.target.value }),
              }),
            ),
            h(
              Field,
              { label: t('entryAmount') },
              h('input', {
                style: { ...S.input, ...S.amountInput },
                inputMode: 'decimal',
                placeholder: '0.00',
                disabled: busy !== null,
                value: entry.amount,
                onChange: (event) => updateEntry({ amount: event.target.value }),
              }),
            ),
          ),
          h(
            'div',
            { style: S.row },
            h(
              Field,
              { label: t('entryCategory') },
              h(
                'select',
                {
                  style: { ...S.select, minWidth: 180 },
                  disabled: busy !== null,
                  value: entry.category,
                  onChange: (event) => updateEntry({ category: event.target.value }),
                },
                h('option', { value: '' }, t('entryChooseCategory')),
                entryCategoryOptions.map((account) => h('option', { key: account.account, value: account.name }, account.name)),
              ),
            ),
            h(
              Field,
              { label: t('entrySource') },
              h(
                'select',
                {
                  style: { ...S.select, minWidth: 180 },
                  disabled: busy !== null,
                  value: entry.source,
                  onChange: (event) => updateEntry({ source: event.target.value }),
                },
                h('option', { value: '' }, t('entryChooseSource')),
                entrySourceOptions.map((account) => h('option', { key: account.account, value: account.name }, account.name)),
              ),
            ),
            h(
              Field,
              { label: t('entryNarration') },
              h('input', {
                style: { ...S.input, width: 260 },
                disabled: busy !== null,
                value: entry.narration,
                onChange: (event) => updateEntry({ narration: event.target.value }),
              }),
            ),
          ),
          noAccounts ? h('p', { style: S.hint }, t('entryNoAccounts')) : null,
          h(
            'div',
            { style: S.row },
            h(
              Button,
              { variant: 'primary', onClick: saveEntry, busy: busy === 'entry', disabled: busy !== null || noAccounts },
              busy === 'entry' ? t('entrySaving') : t('entrySave'),
            ),
            h(Button, { onClick: () => setEntryOpen(false), disabled: busy !== null }, t('entryCancel')),
          ),
        );
      }

      function renderIssues() {
        return h(
          'details',
          { style: S.details },
          h('summary', { style: S.summary }, `${t('metadataIssues')} (${data.issues.length})`),
          h(
            'div',
            { style: { display: 'grid', gap: 4, marginTop: 8 } },
            data.issues.map((issue, index) => h('div', { key: index, style: { ...S.issue, fontSize: 12 } }, issueText(t, issue))),
          ),
        );
      }
    }

    /**
     * Translate a transport or domain failure into a sentence for the panel.
     * @param {Function} t localized translator.
     * @param {Error & { code?: string, details?: object }} failure thrown value.
     * @returns {string} display text.
     */
    function describeFailure(t, failure) {
      if (failure?.handled === true) return String(failure.message);
      const code = failure?.code ?? '';
      if (code === 'HTTP_401' || code === 'HTTP_403') return t('errorAuth');
      if (['engine_missing', 'engine_probe_failed', 'engine_source_missing', 'engine_python_missing', 'engine_install_failed', 'engine_core_changed'].includes(code)) {
        return `${t('errorEngine')}${failure?.message ?? ''}`;
      }
      if (['core_unavailable', 'core_timeout', 'core_protocol_error', 'bridge_error', 'internal_error'].includes(code)) {
        return `${t('errorCore')}${failure?.message ?? ''}`;
      }
      if (code === 'bean_check_unavailable' || /ENOENT/.test(String(failure?.message ?? ''))) return t('errorUnavailable');
      if (code === 'balance_mismatch') {
        const details = failure.details ?? {};
        return fill(t('mismatch'), {
          expected: details.expected ?? '?',
          accumulated: details.accumulated ?? '?',
          difference: details.difference ?? '?',
          currency: details.currency ?? '',
        });
      }
      if (code === 'directory_not_empty') return t('setupNotEmpty');
      if (code === 'ledger_exists') return t('setupExists');
      if (code === 'balance_exists') return t('balanceExists');
      if (code === 'closed_account') return t('closedAccount');
      if (code === 'invalid_amount') return t('invalidAmount');
      if (code === 'invalid_currency') {
        const details = failure.details ?? {};
        if (Array.isArray(details.allowed) && details.allowed.length > 0) {
          return fill(t('errorInvalidCurrency'), {
            currency: details.currency ?? '',
            allowed: details.allowed.join(', '),
          });
        }
        return failure?.message ? String(failure.message) : t('errorInvalidCurrency');
      }
      if (code === 'account_not_opened') return t('errorAccountNotOpened');
      if (code === 'invalid_alias') return fill(t('errorInvalidAlias'), { message: failure.message ?? '' });
      if (code === 'invalid_account') return t('errorInvalidAccount');
      if (code === 'future_date') return t('errorFutureDate');
      if (code === 'invalid_period') return t('errorInvalidPeriod');
      if (code === 'unbalanced') return t('errorUnbalanced');
      if (code === 'bean_check_failed') return `${t('errorBeanCheck')}${failure.message}`;
      if (code === 'alias_conflict') return `${t('errorAliasConflict')}${failure.message}`;
      if (code === 'draft_not_pending') return t('errorDraftNotPending');
      if (code === 'unresolved_postings') return t('errorUnresolved');
      return failure?.message ? String(failure.message) : t('errorGeneric');
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const slots = ctx.slots;
        const locale = ctx.locale;
        localeService = locale;
        const t = locale.bind(NS);

        ctx.effect(() => {
          const disposeZh = locale.register(NS, 'zh', ZH);
          const disposeEn = locale.register(NS, 'en', EN);
          return () => {
            disposeEn();
            disposeZh();
          };
        }, 'ledger-domain: dictionaries');

        ctx.effect(
          () => slots.inject('main', () => slots.register({ name: 'main', key: PANEL_ID }, LedgerPanel)),
          'ledger-domain: main panel',
        );

        ctx.effect(
          () =>
            slots.inject('sidebar.panellist', () =>
              slots.register(
                {
                  name: 'sidebar.panellist',
                  id: PANEL_ID,
                  order: 15,
                  label: () => t('title'),
                },
                Glyph,
              ),
            ),
          'ledger-domain: sidebar entry',
        );
      },
    };
  },
});
