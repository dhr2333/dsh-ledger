window.__ModuleLoader__.load({
  id: '@dhr2333/dsh-ledger',
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
      balances: '/ledger-api/balances',
      balance: '/ledger-api/balance',
      reconPreview: '/ledger-api/reconcile/preview',
      reconCommit: '/ledger-api/reconcile/commit',
      reconHistory: '/ledger-api/reconcile/history',
      metadata: '/ledger-api/metadata',
      draftSubmit: '/ledger-api/draft/submit',
      accountOpen: '/ledger-api/account/open',
      operationApprove: '/ledger-api/operation/approve',
      operationApproveAll: '/ledger-api/operation/approve-all',
      draftApproveAll: '/ledger-api/draft/approve-all',
      operationReject: '/ledger-api/operation/reject',
      approve: '/ledger-api/draft/approve',
      reject: '/ledger-api/draft/reject',
    };
    const PERIODS = ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

    const ZH = {
      title: '本地账本',
      refresh: '刷新',
      refreshing: '刷新中…',
      loading: '正在读取账本…',
      loadFailed: '读取账本失败',
      retry: '重试',
      tabTodo: '审核',
      tabAccounts: '账户',
      reconcileTitle: '待对账',
      reconUnreconciled: '未对账',
      reconOpen: '对账',
      reconUpdate: '更新对账',
      reconEditing: '对账中…',
      reconActual: '实际余额',
      reconExpected: '预期余额',
      reconDifference: '差额',
      reconRemainingHint: '剩余 {amount} 将由 {account} 自动吸收',
      reconAutoPadHint: '未分配差额自动计入 {account}',
      reconAllocations: '差额分配（可选）',
      reconAmount: '金额',
      reconDate: '日期',
      reconNote: '备注',
      reconChooseAccount: '选择账户',
      reconAddAllocation: '+ 添加分配',
      reconCommit: '确认对账',
      reconCommitting: '写入中…',
      reconCommitted: '对账已写入',
      reconModeCreate: '新建对账',
      reconModeUpdate: '更新最近一次',
      reconClose: '关闭',
      due: '待对账',
      statusDue: '待对账',
      statusOverdue: '逾期',
      statusScheduled: '未到期',
      overdue: '逾期',
      allClear: '当前没有到期的账户。',
      noPeriod: '还没有配置对账周期。到「账户」页给资产/负债账户设置周期。',
      period: '周期',
      recorded: '已记录 {name} 的余额 {amount} {currency}',
      noAmount: '请填写金额',
      invalidAmount: '金额必须是十进制数字，例如 -32.50',
      mismatch: '余额不一致：账本累计 {accumulated} {currency}，你申报 {expected} {currency}（差异 {difference} {currency}）。未写入任何内容。',
      balanceExists: '该账户当天已经有一条同币种断言。',
      closedAccount: '账户已关闭，无法对账。',
      reviewTitle: '待审核草稿',
      pendingEmpty: '还没有待审核草稿。把最近一个月的账单交给账本工作区的 Agent。',
      starterPrompt: '这是我最近一个月的支付宝/微信账单（附件）。帮我记成草稿：\n- 分类不确定的标出来，不要猜；\n- 不要直接写入，等我审核；\n- 金额/日期按账单原文。',
      operationsTitle: '待你批准的账本变更',
      operationAccountOpen: '开户',
      operationAccountRedate: '修改开立日',
      operationAccountMetadata: '修改元数据',
      operationBalance: '余额申报',
      operationOpenSummary: '开户：{account}',
      operationOpenAliasSummary: '开户：{account}（别名 {alias}）',
      operationRedateAllSummary: '全部账户开立日前移到 {date}',
      operationRedateSummary: '{count} 个账户开立日前移到 {date}',
      operationMetadataBoth: '修改 {account} 的别名与周期',
      operationMetadataAlias: '修改 {account} 的别名',
      operationMetadataPeriod: '修改 {account} 的对账周期',
      operationBalanceSummary: '对账：{account} = {amount} {currency}',
      operationApprove: '批准',
      operationReject: '驳回',
      operationRejected: '已驳回该变更',
      operationApproved: '已应用该变更',
      approveAllOps: '一键批准全部（{count}）',
      approveAllDrafts: '一键批准全部（{count}）',
      approvedAllOps: '已批准 {count} 条账本变更',
      approvedAllDrafts: '已入账 {count} 笔，跳过 {skipped} 笔',
      approveAllFailed: '有 {count} 条未能批准，已保留在审核中',
      approve: '批准',
      addAccount: '新增账户',
      accountAdded: '已新增账户 {name}',
      accountCanonical: '账户名',
      accountOpenDate: '开立日期',
      draftReadonlyHint: '待审核草稿在 DSH 中为只读；需要调整请驳回，让 Agent 重新提案。',
      approving: '写入中…',
      reject: '驳回',
      rejecting: '驳回中…',
      rejectReason: '驳回原因（可选）',
      rejectReasonPlaceholder: '例如：不是我的消费',
      issues: '校验问题',
      unresolved: '未分类',
      confidence: '置信度',
      source: '来源',
      sourceAi: 'Agent',
      sourceQuickpath: '别名匹配',
      sourceManual: '手动',
      sourceImport: '导入',
      sourceExternal: '外部',
      statusPending: '待审核',
      accountsTitle: '账户',
      searchAccounts: '搜索账户或别名',
      accountName: '名称',
      alias: '别名',
      aliasPlaceholder: '给这个账户起一个别名',
      save: '保存',
      saving: '保存中…',
      saved: '已保存 {name}',
      accountShowHidden: '显示已隐藏（{count}）',
      accountHideHidden: '收起已隐藏',
      accountSelectHint: '选择左侧账户查看详情',
      accountEditAlias: '点击编辑别名',
      accountHasChildren: '有子账户，只有叶子账户可对账，周期已禁用',
      accountReadonly: '该账户只读',
      accountHiddenBadge: '已隐藏',
      accountDiscard: '当前修改尚未保存，切换账户会丢失修改。继续？',
      accountClearConfirm: '保存后将清除别名，树中改用账户路径显示。确认清除？',
      accountClearTitle: '清空别名',
      accountClear: '确认清除',
      accountUnsavedTitle: '有未保存修改',
      accountDiscardConfirm: '放弃修改',
      noAccounts: '没有匹配的账户。',
      notConfigured: '未配置周期',
      implicit: '隐式',
      metadataIssues: '元数据问题',
      quota: '共 {count} 个账户',
      none: '不提醒',
      daily: '每天',
      weekly: '每周',
      monthly: '每月',
      quarterly: '每季度',
      yearly: '每年',
      dismiss: '关闭',
      errorAuth: '登录会话已过期，请刷新页面后重试。',
      errorGeneric: '操作失败',
      errorBeanCheck: '账本校验未通过：',
      errorAliasConflict: '别名冲突：',
      errorUnavailable: '账本引擎不可用，请重试或重新安装引擎。',
      errorCore: '账本引擎出错：',
      engineTitle: '准备账本引擎',
      enginePath: '引擎位置',
      engineInstall: '安装 / 修复账本引擎',
      engineInstalling: '正在准备引擎，首次可能需要几分钟…',
      engineLog: '安装日志',
      engineError: '引擎操作失败：',
      errorEngine: '引擎操作失败：',
      setupTitle: '创建你的第一个账本',
      setupPath: '账本位置',
      setupName: '账本名称',
      setupBrowse: '选择目录…',
      setupPickFailed: '目录选择器不可用。',
      dirPickerTitle: '选择账本目录',
      dirPickerHome: '主目录',
      dirPickerCancel: '取消',
      dirPickerHere: '选择此目录',
      dirPickerLoading: '正在读取目录…',
      dirPickerEmpty: '这个目录下没有子目录。',
      dirPickerFailed: '读取目录失败：{message}',
      dirPickerCreate: '新建文件夹',
      dirPickerCreateAction: '新建',
      dirPickerCreateFailed: '新建文件夹失败：{message}',
      dirPickerTruncated: '目录过多，仅显示前一部分。',
      setupCreate: '创建账本',
      setupCreating: '正在创建…',
      setupCreated: '账本已创建：{title}',
      setupOpened: '已打开已有账本：{title}',
      setupNotEmpty: '这个文件夹不是空的，请换一个空文件夹。',
      setupNameRequired: '请填写账本名称。',
      setupExists: '这个位置已经有账本了，刷新即可打开。',
      manualEntry: '补记',
      entryTitle: '补记一笔',
      entryHint: '最佳实践：上传账单文件让 Agent 提案；其次：每天对账；最后才是按次补记。也可以直接在工作区对话里描述，Agent 会把草稿放进审核页。',
      liabilityNegativeHint: '负债账户的余额正常为负数，例如 -1234.56。',
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
      approvedWritten: '已批准并写入 {file}',
      approvedExisting: '该草稿已在账本中，无需重复写入。',
      rejectedNotice: '已驳回 {id}',
      closed: '已关闭',
      currency: '币种',
      issueUnresolved: '第 {number} 条分录的账户未分类',
      issueUnbalanced: '分录不平衡，差额：{differences}',
      issueBeforeOpen: '第 {number} 条分录：{account} 在交易日期之后才开立',
      issueClosed: '第 {number} 条分录：{account} 在交易日期已关闭',
      issueFuture: '交易日期在未来',
      issueAccountExists: '{account} 已存在',
      issueAliasConflict: '别名 {alias} 已被占用',
      issueAccountNotFound: '{account} 不是已知账户',
      issueAccountNotOpened: '{account} 尚未开户',
      issueNotReconcilable: '只有资产或负债账户可以对账',
      issueMissingFile: '账本文件不存在：{file}',
      issueUnreadableFile: '无法读取账本文件：{file}',
      issueDuplicateOpen: '账户重复开户：{account}',
      issueDuplicateAlias: '别名重复：{alias}',
      issueInvalidPeriod: '{account} 的对账周期不合法：{period}',
      issueInvalidMetadata: '{account} 的元数据不合法',
      issueAliasShadows: '别名 {alias} 与账户名 {account} 重复',
      issueInvalidAccount: '账户名不合法：{account}',
      issueInvalidReconcile: '{account} 不是资产或负债账户，不能设置对账周期',
      issueInvalidCurrency: '{account} 声明了不合法币种 {currency}',
      errorInvalidCurrency: '币种 {currency} 不在该账户的开户声明中（允许：{allowed}）',
      errorAccountNotOpened: '该账户尚未开户，暂不能设置别名或周期。',
      errorInvalidAlias: '别名不合法：{message}',
      errorInvalidAccount: '账户名不合法。',
      errorFutureDate: '日期不能在未来。',
      errorInvalidPeriod: '对账周期不合法。',
      errorUnbalanced: '分录不平衡。',
    };

    const EN = {
      title: 'Ledger',
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      loading: 'Reading the ledger…',
      loadFailed: 'Could not read the ledger',
      retry: 'Retry',
      tabTodo: 'Review',
      tabAccounts: 'Accounts',
      reconcileTitle: 'Due for reconciliation',
      reconUnreconciled: 'Not reconciled',
      reconOpen: 'Reconcile',
      reconUpdate: 'Update reconciliation',
      reconEditing: 'Reconciling…',
      reconActual: 'Actual balance',
      reconExpected: 'Expected',
      reconDifference: 'Difference',
      reconRemainingHint: 'The remaining {amount} will be absorbed by {account}',
      reconAutoPadHint: 'Unallocated difference goes to {account}',
      reconAllocations: 'Difference allocations (optional)',
      reconAmount: 'Amount',
      reconDate: 'Date',
      reconNote: 'Note',
      reconChooseAccount: 'Choose account',
      reconAddAllocation: '+ Add allocation',
      reconCommit: 'Commit',
      reconCommitting: 'Committing…',
      reconCommitted: 'Reconciliation committed',
      reconModeCreate: 'New reconciliation',
      reconModeUpdate: 'Update latest',
      reconClose: 'Close',

      due: 'Due',
      statusDue: 'Due',
      statusOverdue: 'Overdue',
      statusScheduled: 'Scheduled',
      overdue: 'Overdue',
      allClear: 'No account is due right now.',
      noPeriod: 'No reconciliation period is configured yet. Set one for asset and liability accounts on the Accounts tab.',
      period: 'Period',
      recorded: 'Recorded {amount} {currency} for {name}',
      noAmount: 'Enter an amount',
      invalidAmount: 'Use a decimal amount, for example -32.50',
      mismatch: 'Balance mismatch: the ledger accumulates {accumulated} {currency}, you declared {expected} {currency} (difference {difference} {currency}). Nothing was written.',
      balanceExists: 'This account already has an assertion for that date and currency.',
      closedAccount: 'The account is closed and cannot be reconciled.',
      reviewTitle: 'Pending drafts',
      pendingEmpty: 'No drafts yet. Hand last month of bills to the agent in the ledger workspace.',
      starterPrompt: "Here is last month's Alipay/WeChat statement (attached). Draft the entries for me:\n- Flag anything you are unsure about; do not guess.\n- Do not write directly; wait for my review.\n- Keep amounts and dates as they appear in the statement.",
      operationsTitle: 'Ledger changes awaiting approval',
      operationAccountOpen: 'Open account',
      operationAccountRedate: 'Change open date',
      operationAccountMetadata: 'Edit metadata',
      operationBalance: 'Balance assertion',
      operationOpenSummary: 'Open account: {account}',
      operationOpenAliasSummary: 'Open account: {account} (alias {alias})',
      operationRedateAllSummary: 'Move all open dates to {date}',
      operationRedateSummary: 'Move {count} accounts to open on {date}',
      operationMetadataBoth: 'Edit the alias and period for {account}',
      operationMetadataAlias: 'Edit the alias for {account}',
      operationMetadataPeriod: 'Edit the reconciliation period for {account}',
      operationBalanceSummary: 'Reconcile: {account} = {amount} {currency}',
      operationApprove: 'Approve',
      operationReject: 'Reject',
      operationRejected: 'Change rejected',
      operationApproved: 'Change applied',
      approveAllOps: 'Approve all ({count})',
      approveAllDrafts: 'Approve all ({count})',
      approvedAllOps: 'Approved {count} ledger changes',
      approvedAllDrafts: 'Posted {count}, skipped {skipped}',
      approveAllFailed: '{count} could not be approved and stayed pending',
      approve: 'Approve',
      addAccount: 'Add account',
      accountAdded: 'Account {name} added',
      accountCanonical: 'Account name',
      accountOpenDate: 'Open date',
      draftReadonlyHint: 'Pending drafts are read-only in DSH. Reject one if it needs changes, then let the agent propose again.',
      approving: 'Writing…',
      reject: 'Reject',
      rejecting: 'Rejecting…',
      rejectReason: 'Reason (optional)',
      rejectReasonPlaceholder: 'For example: not my purchase',
      issues: 'Issues',
      unresolved: 'Unclassified',
      confidence: 'Confidence',
      source: 'Source',
      sourceAi: 'Agent',
      sourceQuickpath: 'Alias match',
      sourceManual: 'Manual',
      sourceImport: 'Import',
      sourceExternal: 'External',
      statusPending: 'Pending',
      accountsTitle: 'Accounts',
      searchAccounts: 'Search account or alias',
      accountName: 'Name',
      alias: 'Alias',
      aliasPlaceholder: 'Give this account an alias',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved {name}',
      accountShowHidden: 'Show hidden ({count})',
      accountHideHidden: 'Hide hidden',
      accountSelectHint: 'Select an account on the left',
      accountEditAlias: 'Click to edit the alias',
      accountHasChildren: 'This account has children; only leaf accounts can be reconciled, so the period is disabled',
      accountReadonly: 'This account is read-only',
      accountHiddenBadge: 'Hidden',
      accountDiscard: 'You have unsaved changes. Switching accounts will discard them. Continue?',
      accountClearConfirm: 'Saving will clear the alias and show the account path in the tree. Clear it?',
      accountClearTitle: 'Clear alias',
      accountClear: 'Clear alias',
      accountUnsavedTitle: 'Unsaved changes',
      accountDiscardConfirm: 'Discard changes',
      noAccounts: 'No account matches.',
      notConfigured: 'No period',
      implicit: 'Implicit',
      metadataIssues: 'Metadata issues',
      quota: '{count} accounts',
      none: 'Off',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      dismiss: 'Dismiss',
      errorAuth: 'The session expired. Refresh the page and try again.',
      errorGeneric: 'The operation failed',
      errorBeanCheck: 'Ledger validation failed: ',
      errorAliasConflict: 'Alias conflict: ',
      errorUnavailable: 'The ledger engine is unavailable. Retry or reinstall it.',
      errorCore: 'Ledger engine error: ',
      engineTitle: 'Prepare the ledger engine',
      enginePath: 'Engine location',
      engineInstall: 'Install / repair engine',
      engineInstalling: 'Preparing the engine; the first run can take a few minutes…',
      engineLog: 'Install log',
      engineError: 'Engine operation failed: ',
      errorEngine: 'Engine operation failed: ',
      setupTitle: 'Create your first ledger',
      setupPath: 'Ledger location',
      setupName: 'Ledger name',
      setupBrowse: 'Choose folder…',
      setupPickFailed: 'The directory picker is unavailable.',
      dirPickerTitle: 'Choose ledger folder',
      dirPickerHome: 'Home',
      dirPickerCancel: 'Cancel',
      dirPickerHere: 'Use this folder',
      dirPickerLoading: 'Reading folder…',
      dirPickerEmpty: 'No subfolders here.',
      dirPickerFailed: 'Could not read the folder: {message}',
      dirPickerCreate: 'New folder',
      dirPickerCreateAction: 'Create',
      dirPickerCreateFailed: 'Could not create the folder: {message}',
      dirPickerTruncated: 'Too many folders; showing only the first part.',
      setupCreate: 'Create ledger',
      setupCreating: 'Creating…',
      setupCreated: 'Ledger created: {title}',
      setupOpened: 'Opened existing ledger: {title}',
      setupNotEmpty: 'This folder is not empty. Choose an empty folder.',
      setupNameRequired: 'Enter a ledger name.',
      setupExists: 'A ledger already exists here; refresh to open it.',
      manualEntry: 'Fallback entry',
      entryTitle: 'Add a fallback entry',
      entryHint: 'Best: upload a statement file and let the agent propose entries; next: reconcile daily; use a fallback entry only for one-off gaps. You can also describe it in the workspace conversation and review the draft here.',
      liabilityNegativeHint: 'Liability balances are normally negative, e.g. -1234.56.',
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
      approvedWritten: 'Approved and written to {file}',
      approvedExisting: 'This draft is already in the ledger; nothing was written again.',
      rejectedNotice: 'Rejected {id}',
      closed: 'Closed',
      currency: 'Currency',
      issueUnresolved: 'Posting {number} has no account',
      issueUnbalanced: 'Postings are unbalanced by {differences}',
      issueBeforeOpen: 'Posting {number}: {account} opens after the transaction date',
      issueClosed: 'Posting {number}: {account} is closed on the transaction date',
      issueFuture: 'The transaction date is in the future',
      issueAccountExists: '{account} already exists',
      issueAliasConflict: 'Alias {alias} is already in use',
      issueAccountNotFound: '{account} is not a known account',
      issueAccountNotOpened: '{account} has not been opened',
      issueNotReconcilable: 'Only asset and liability accounts can be reconciled',
      issueMissingFile: 'Ledger file not found: {file}',
      issueUnreadableFile: 'Cannot read the ledger file: {file}',
      issueDuplicateOpen: 'Account opened more than once: {account}',
      issueDuplicateAlias: 'Duplicate alias: {alias}',
      issueInvalidPeriod: 'Unsupported reconciliation period for {account}: {period}',
      issueInvalidMetadata: 'Invalid metadata for {account}',
      issueAliasShadows: 'Alias {alias} duplicates account name {account}',
      issueInvalidAccount: 'Invalid account name: {account}',
      issueInvalidReconcile: '{account} is not an asset or liability account and cannot have a reconciliation period',
      issueInvalidCurrency: '{account} declares an invalid currency: {currency}',
      errorInvalidCurrency: 'Currency {currency} is not declared for this account (allowed: {allowed})',
      errorAccountNotOpened: 'This account has not been opened; its alias and period cannot be edited.',
      errorInvalidAlias: 'Invalid alias: {message}',
      errorInvalidAccount: 'Invalid account name.',
      errorFutureDate: 'The date cannot be in the future.',
      errorInvalidPeriod: 'Invalid reconciliation period.',
      errorUnbalanced: 'The postings are not balanced.',
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
      headMeta: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
      meta: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
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
      mono: { fontFamily: 'var(--ds-font-family-code, ui-monospace, monospace)', fontSize: 11 },
      spacer: { height: 2 },
      accountLayout: { display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' },
      accountTreePanel: {
        flex: '1 1 240px',
        maxWidth: 340,
        maxHeight: '62vh',
        overflow: 'auto',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-layer-1)',
        padding: 8,
        boxSizing: 'border-box',
      },
      accountDetailPanel: {
        flex: '2 1 360px',
        minWidth: 280,
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-layer-1)',
        padding: '14px 16px',
        boxSizing: 'border-box',
      },
      treeRow: { display: 'flex', alignItems: 'center', gap: 4, minHeight: 26, borderRadius: 6 },
      treeRowSelected: { background: 'var(--dsw-alias-bg-layer-2)' },
      treeToggle: {
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        width: 16,
        minWidth: 16,
        padding: 0,
        font: 'inherit',
        fontSize: 11,
        cursor: 'pointer',
      },
      treeLabel: {
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        padding: '2px 4px',
        font: 'inherit',
        fontSize: 12,
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flex: '1 1 auto',
        minWidth: 0,
        overflow: 'hidden',
      },
      treeDot: { width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flex: 'none' },
      treeAmount: {
        fontSize: 11,
        color: 'var(--dsw-alias-label-secondary)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        flex: 'none',
        paddingRight: 2,
      },
      modalBackdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 17, 21, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      },
      modalCard: {
        width: 'min(560px, 100%)',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-1)',
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.24)',
        padding: 16,
        display: 'grid',
        gap: 12,
      },
      modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
      modalBody: { display: 'grid', gap: 10 },
      modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
      dirCrumbs: { display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', minWidth: 0 },
      dirCrumb: {
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-brand-primary)',
        padding: '2px 4px',
        borderRadius: 4,
        font: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      dirList: {
        display: 'grid',
        gap: 2,
        alignContent: 'start',
        maxHeight: 280,
        overflow: 'auto',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        padding: 6,
        minHeight: 96,
      },
      dirRow: {
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        textAlign: 'left',
        padding: '6px 8px',
        borderRadius: 6,
        font: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        minWidth: 0,
      },
    };

    /** Replace `{name}` tokens in a dictionary string. */
    function fill(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (match, key) => (values && Object.hasOwn(values, key) ? String(values[key]) : match));
    }

    /** Client root context, used to resolve the host directory picker lazily. */
    let clientContext = null;

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
      // A <label> wrapping a <select> makes Firefox re-activate the control when
      // an option is chosen, which reopens the native menu and can lock the page.
      // Keep the visual label, but do not let it act as a form label.
      return h(
        'div',
        { style: { display: 'grid', gap: 4, minWidth: 0 }, role: 'group', 'aria-label': label },
        h('span', { style: S.label }, label),
        children,
      );
    }

    function Modal({ title, children, footer, onClose }) {
      return h(
        'div',
        {
          style: S.modalBackdrop,
          role: 'presentation',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget && onClose) onClose();
          },
        },
        h(
          'div',
          { style: S.modalCard, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
          h(
            'div',
            { style: S.modalHead },
            h('h3', { style: S.sectionTitle }, title),
            h(Button, { onClick: onClose, title: 'Close' }, '×'),
          ),
          h('div', { style: S.modalBody }, children),
          footer ? h('div', { style: S.modalFoot }, footer) : null,
        ),
      );
    }

    function formatMoney(amount, currency) {
      return `${amount} ${currency}`;
    }

    /**
     * Parse a decimal amount to millionths, matching the core's 6-digit
     * precision. Returns null for anything the input cannot represent, so the
     * difference field shows a dash instead of a wrong number. This is display
     * arithmetic only: the core recomputes every authoritative value.
     */
    function parseScaledAmount(text) {
      const match = /^([+-]?)(\d+)(?:\.(\d{1,6}))?$/.exec(String(text ?? '').trim());
      if (match === null) return null;
      const sign = match[1] === '-' ? -1 : 1;
      const fraction = (match[3] ?? '').padEnd(6, '0');
      return sign * (Number(match[2]) * 1000000 + Number(fraction));
    }

    function formatScaledAmount(value) {
      const negative = value < 0;
      const absolute = Math.abs(value);
      let whole = Math.floor(absolute / 1000000);
      let cents = Math.round((absolute % 1000000) / 10000);
      if (cents === 100) {
        whole += 1;
        cents = 0;
      }
      return `${negative ? '-' : ''}${whole}.${String(cents).padStart(2, '0')}`;
    }

    function statusLabel(t, status) {
      return t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}`);
    }

    function periodLabel(t, period) {
      return period && PERIODS.includes(period) ? t(period) : t('notConfigured');
    }

    const ACCOUNT_ROOTS = ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'];

    // Parent groups have no open directive, so their display names are a
    // presentation-only fallback. A leaf alias always wins. Keys are full
    // paths, not bare segments, so Income:Transfer and Assets:Transfer can
    // never collide.
    const PARENT_LABELS = {
      Assets: '资产',
      'Assets:Savings': '储蓄',
      'Assets:Savings:Bank': '银行',
      'Assets:Savings:Web': '电子钱包',
      'Assets:Savings:Cash': '现金',
      Liabilities: '负债',
      'Liabilities:CreditCard': '信用卡',
      'Liabilities:CreditCard:Bank': '银行',
      Equity: '权益',
      Income: '收入',
      'Income:Active': '主动收入',
      'Income:Active:Salary': '工资',
      'Income:Active:Salary:Subsidy': '补贴',
      'Income:Investment': '投资收入',
      'Income:Transfer': '转移收入',
      Expenses: '支出',
      'Expenses:Culture': '文化休闲',
      'Expenses:Finance': '财务金融',
      'Expenses:Food': '餐饮',
      'Expenses:Health': '健康',
      'Expenses:Home': '居家',
      'Expenses:Shopping': '购物',
      'Expenses:TransPort': '交通',
      'Expenses:TransPort:Private': '私家车',
    };

    /**
     * Group the flat bootstrap account list into a display tree.
     *
     * Beancount has no explicit parent directive, so every intermediate path is
     * synthesised as a virtual group. A path is a real account exactly when it
     * has an open directive; that account may still have children (income and
     * expense parents usually do), so a node can be both recordable and
     * expandable. Virtual nodes have no account object and are never editable.
     */
    function buildAccountTree(accounts) {
      const roots = [];
      const nodeMap = new Map();
      const ensureNode = (path) => {
        const existing = nodeMap.get(path);
        if (existing !== undefined) return existing;
        const parts = path.split(':');
        const node = {
          key: path,
          path,
          label: PARENT_LABELS[path] ?? parts[parts.length - 1],
          virtual: true,
          children: [],
          account: null,
          hidden: false,
        };
        nodeMap.set(path, node);
        if (parts.length === 1) {
          roots.push(node);
        } else {
          ensureNode(parts.slice(0, -1).join(':')).children.push(node);
        }
        return node;
      };
      for (const name of ACCOUNT_ROOTS) ensureNode(name);
      const sorted = accounts.slice().sort((left, right) => left.account.localeCompare(right.account));
      for (const account of sorted) {
        const parts = account.account.split(':');
        if (parts.length < 2) continue;
        // Promote an existing virtual ancestor to a real account instead of
        // adding a second node for the same path.
        const node = ensureNode(account.account);
        node.virtual = false;
        node.account = account;
        node.label = account.name || account.account;
        node.hidden = account.implicit === true || account.closed === true;
      }
      const sort = (nodes) => {
        nodes.sort((left, right) => {
          if (left.virtual !== right.virtual) return left.virtual ? -1 : 1;
          return left.path.localeCompare(right.path);
        });
        for (const node of nodes) sort(node.children);
      };
      for (const root of roots) sort(root.children);
      return roots;
    }

    // Count recordable accounts, not tree leaves: an account that also has
    // children (income/expense parents) still counts as one.
    function countTreeLeaves(node) {
      const own = node.virtual ? 0 : 1;
      return own + node.children.reduce((total, child) => total + countTreeLeaves(child), 0);
    }

    function countTreeDue(node) {
      const own = !node.virtual && node.account && (node.account.status === 'due' || node.account.status === 'overdue') ? 1 : 0;
      return own + node.children.reduce((total, child) => total + countTreeDue(child), 0);
    }

    function treeHasChildren(accounts, path) {
      return accounts.some((account) => account.account !== path && account.account.startsWith(`${path}:`));
    }

    /** Localized sentence for one domain issue; core messages stay a fallback. */
    function issueText(t, issue) {
      const keys = {
        unresolved_account: 'issueUnresolved',
        unbalanced: 'issueUnbalanced',
        before_account_open: 'issueBeforeOpen',
        closed_account: 'issueClosed',
        future_dated: 'issueFuture',
        account_exists: 'issueAccountExists',
        alias_conflict: 'issueAliasConflict',
        account_not_found: 'issueAccountNotFound',
        account_not_opened: 'issueAccountNotOpened',
        not_reconcilable: 'issueNotReconcilable',
        missing_file: 'issueMissingFile',
        unreadable_file: 'issueUnreadableFile',
        duplicate_open: 'issueDuplicateOpen',
        duplicate_alias: 'issueDuplicateAlias',
        invalid_period: 'issueInvalidPeriod',
        invalid_metadata: 'issueInvalidMetadata',
        alias_shadows_account: 'issueAliasShadows',
        invalid_account: 'issueInvalidAccount',
        invalid_reconcile_account: 'issueInvalidReconcile',
        invalid_currency: 'issueInvalidCurrency',
      };
      const key = keys[issue.code];
      if (key === undefined) return issue.message ?? '';
      const differences = Array.isArray(issue.differences)
        ? issue.differences.map((entry) => `${entry.difference} ${entry.currency}`).join(', ')
        : '—';
      return fill(t(key), {
        number: typeof issue.postingIndex === 'number' ? issue.postingIndex + 1 : '—',
        account: issue.account ?? issue.suggested ?? '—',
        alias: issue.alias ?? '—',
        currency: issue.currency ?? '—',
        period: issue.period ?? '—',
        file: issue.file ?? '—',
        differences,
      });
    }

    /** Readable name for one pending ledger change, empty when unknown. */
    function operationKindName(t, kind) {
      const keys = {
        'account-open': 'operationAccountOpen',
        'account-redate': 'operationAccountRedate',
        'account-metadata': 'operationAccountMetadata',
        balance: 'operationBalance',
      };
      return keys[kind] ? t(keys[kind]) : '';
    }

    /** Localized one-line summary for a pending ledger change. */
    function operationSummary(t, operation) {
      const payload = operation.payload ?? {};
      const account = payload.account ?? '—';
      if (operation.kind === 'account-open') {
        return payload.alias
          ? fill(t('operationOpenAliasSummary'), { account, alias: payload.alias })
          : fill(t('operationOpenSummary'), { account });
      }
      if (operation.kind === 'account-redate') {
        return payload.all
          ? fill(t('operationRedateAllSummary'), { date: payload.date ?? '—' })
          : fill(t('operationRedateSummary'), { count: Array.isArray(payload.accounts) ? payload.accounts.length : 0, date: payload.date ?? '—' });
      }
      if (operation.kind === 'account-metadata') {
        const hasAlias = Object.hasOwn(payload, 'alias');
        const hasPeriod = Object.hasOwn(payload, 'reconcile');
        const key = hasAlias && hasPeriod
          ? 'operationMetadataBoth'
          : hasAlias ? 'operationMetadataAlias' : 'operationMetadataPeriod';
        return fill(t(key), { account });
      }
      if (operation.kind === 'balance') {
        return fill(t('operationBalanceSummary'), {
          account,
          amount: payload.amount ?? '—',
          currency: payload.currency ?? '',
        });
      }
      return operation.summary ?? '';
    }

    /** Readable name for one draft source, empty when unknown. */
    function sourceName(t, kind) {
      const keys = {
        ai: 'sourceAi',
        quickpath: 'sourceQuickpath',
        manual: 'sourceManual',
        import: 'sourceImport',
        external: 'sourceExternal',
      };
      return keys[kind] ? t(keys[kind]) : '';
    }

    /** Source and confidence line for a draft card, empty when neither exists. */
    function draftMetaLine(t, draft) {
      return [
        sourceName(t, draft.source?.kind) ? `${t('source')}: ${sourceName(t, draft.source?.kind)}` : '',
        typeof draft.confidence === 'number' ? `${t('confidence')}: ${Math.round(draft.confidence * 100)}%` : '',
      ].filter(Boolean).join(' · ');
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
      const [setupForm, setSetupForm] = React.useState({ title: '我的账本', root: '' });
      const [dirPicker, setDirPicker] = React.useState(null);
      const [data, setData] = React.useState(null);
      const [balances, setBalances] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [loadError, setLoadError] = React.useState(null);
      const [notice, setNotice] = React.useState(null);
      const [actionError, setActionError] = React.useState(null);
      const [tab, setTab] = React.useState('todo');
      const [busy, setBusy] = React.useState(null);
      const [balanceInputs, setBalanceInputs] = React.useState({});
      const [reconEditor, setReconEditor] = React.useState(null);
      const [reconAccountPicker, setReconAccountPicker] = React.useState(null);
      const [rejectReasons, setRejectReasons] = React.useState({});
      const [accountQuery, setAccountQuery] = React.useState('');
      const [accountSelected, setAccountSelected] = React.useState(null);
      const [accountExpanded, setAccountExpanded] = React.useState({});
      const [accountShowHidden, setAccountShowHidden] = React.useState(false);
      const [accountDraft, setAccountDraft] = React.useState(null);
      // The account path of the detail whose alias is currently being edited.
      // Keyed by account so switching accounts leaves edit mode.
      const [aliasEditing, setAliasEditing] = React.useState(null);
      const [accountClearOpen, setAccountClearOpen] = React.useState(false);
      const [accountPendingSelect, setAccountPendingSelect] = React.useState(null);
      const [newAccountOpen, setNewAccountOpen] = React.useState(false);
      const [newAccount, setNewAccount] = React.useState({ account: 'Assets:Savings:Bank:', alias: '' });
      const [entryOpen, setEntryOpen] = React.useState(false);
      const [entryPicker, setEntryPicker] = React.useState(null);
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
            setBalances(null);
            return;
          }
          const setupPayload = await fetchJson(API.setup);
          if (request !== generation.current) return;
          setSetup(setupPayload);
          if (setupPayload.initialized !== true) {
            setData(null);
            setBalances(null);
            return;
          }
          const payload = await fetchJson(API.bootstrap);
          if (request !== generation.current) return;
          setData(payload);
          // Amounts are an optional read projection. A failing query must not
          // hide the ledger, so the tree simply renders without amounts.
          try {
            const balancePayload = await fetchJson(API.balances);
            if (request === generation.current) setBalances(balancePayload);
          } catch {
            if (request === generation.current) setBalances(null);
          }
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

      // Seed the location field from the configured/active root once it is known,
      // then leave it editable (clearing it falls back to that root on submit).
      React.useEffect(() => {
        if (typeof setup?.root === 'string' && setup.root !== '') {
          setSetupForm((previous) => (previous.root === '' ? { ...previous, root: setup.root } : previous));
        }
      }, [setup?.root]);

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
      // Canonical account -> current position for the accounts tree. The core
      // projects balances onto display aliases, so join on the same name the
      // tree renders; an ambiguous display name is skipped instead of being
      // attached to two accounts. Only asset and liability leaves with a
      // non-zero balance get an amount: the other three classes are flows or
      // equity, not balances.
      const balanceByAccount = React.useMemo(() => {
        const rows = Array.isArray(balances?.balances) ? balances.balances : [];
        if (rows.length === 0 || accounts.length === 0) return new Map();
        const byName = new Map();
        const ambiguous = new Set();
        for (const account of accounts) {
          if (byName.has(account.name)) ambiguous.add(account.name);
          else byName.set(account.name, account.account);
        }
        for (const name of ambiguous) byName.delete(name);
        const map = new Map();
        for (const row of rows) {
          if (row === null || typeof row !== 'object') continue;
          // A position carrying a cost does not have one comparable amount.
          if (typeof row.cost === 'string' && row.cost !== '') continue;
          const target = typeof row.account === 'string' ? byName.get(row.account) : undefined;
          if (target === undefined) continue;
          if (!target.startsWith('Assets:') && !target.startsWith('Liabilities:')) continue;
          const amount = typeof row.amount === 'string' ? Number(row.amount) : Number.NaN;
          if (!Number.isFinite(amount) || amount === 0) continue;
          map.set(target, { amount: row.amount, currency: typeof row.currency === 'string' ? row.currency : '' });
        }
        return map;
      }, [accounts, balances]);
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
      // Assets and liabilities use their parent paths as grouping only, so a
      // source account must be a leaf even if some parent was opened by hand.
      const assetSources = React.useMemo(
        () => entryAccounts.filter((account) => account.account.startsWith('Assets:') && !treeHasChildren(accounts, account.account)),
        [entryAccounts, accounts],
      );
      const liabilitySources = React.useMemo(
        () => entryAccounts.filter((account) => account.account.startsWith('Liabilities:') && !treeHasChildren(accounts, account.account)),
        [entryAccounts, accounts],
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
      const pendingDrafts = data?.pendingDrafts ?? [];
      const pendingOperations = data?.pendingOperations ?? [];
      const hiddenAccounts = React.useMemo(
        () => accounts.filter((account) => account.implicit === true || account.closed === true),
        [accounts],
      );
      const hiddenCount = hiddenAccounts.length;
      const visibleAccounts = React.useMemo(() => {
        const query = accountQuery.trim().toLowerCase();
        return accounts.filter((account) => {
          const hidden = account.implicit === true || account.closed === true;
          if (!accountShowHidden && query === '' && hidden) return false;
          if (query === '') return true;
          return `${account.account} ${account.name ?? ''} ${account.alias ?? ''}`.toLowerCase().includes(query);
        });
      }, [accounts, accountQuery, accountShowHidden]);
      const accountTree = React.useMemo(() => buildAccountTree(visibleAccounts), [visibleAccounts]);
      const selectedAccount = React.useMemo(
        () => accounts.find((account) => account.account === accountSelected) ?? null,
        [accounts, accountSelected],
      );
      const selectedHasChildren = React.useMemo(
        () => (selectedAccount === null ? false : treeHasChildren(accounts, selectedAccount.account)),
        [accounts, selectedAccount],
      );
      const selectedDraft = selectedAccount === null
        ? null
        : (accountDraft ?? { alias: selectedAccount.alias ?? '', period: selectedAccount.period ?? 'none' });
      const accountDirty = selectedAccount !== null
        && selectedDraft !== null
        && (selectedDraft.alias.trim() !== (selectedAccount.alias ?? '') || selectedDraft.period !== (selectedAccount.period ?? 'none'));
      const selectedReadonly = selectedAccount !== null && (selectedAccount.implicit === true || selectedAccount.closed === true);
      const periodDisabled = selectedReadonly || selectedHasChildren;

      const tabRows = [
        { id: 'todo', label: t('tabTodo'), count: dueAccounts.length + pendingDrafts.length + pendingOperations.length },
        { id: 'accounts', label: t('tabAccounts'), count: null },
      ];

      const entryCategoryOptions = entry.kind === 'expense' ? expenseCategories : incomeCategories;
      const entrySourceOptions = entry.kind === 'expense'
        ? [...assetSources, ...liabilitySources].sort((left, right) => left.name.localeCompare(right.name))
        : assetSources;

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

      function newAllocationRow(asOf) {
        return { account: '', amount: '', date: asOf, note: '' };
      }

      function openRecon(account) {
        const editor = {
          account: account.account,
          name: account.name,
          // Default to today so a new period can advance: the core picks
          // create/update by comparing asOf with the latest block. Using
          // coveredThrough here would pin every reopen to the previous
          // period and make the next reconciliation impossible from the panel.
          asOf: today,
          actual: '',
          rows: [],
          // Internal only: the core's default (Opening-Balances on the first
          // reconciliation, Adjustments afterwards). Hidden from the form, but
          // still sent so a partial allocation leaves a remainder row.
          padAccount: '',
          expected: null,
          mode: null,
          preview: null,
          previewFor: null,
          busy: null,
          error: null,
        };
        setReconAccountPicker(null);
        setReconEditor(editor);
        void previewRecon(editor);
      }

      function reconPayload(editor) {
        const allocations = editor.rows
          .filter((row) => row.account && row.amount.trim() !== '')
          .map((row) => ({
            account: row.account,
            amount: row.amount.trim(),
            date: row.date || editor.asOf,
            note: row.note || '',
          }));
        const payload = {
          account: editor.account,
          asOf: editor.asOf,
          allocations,
        };
        if (editor.actual.trim() !== '') payload.actual = editor.actual.trim();
        if (editor.currency) payload.currency = editor.currency;
        if (editor.padAccount) payload.padAccount = editor.padAccount;
        return payload;
      }

      function reconKey(editor) {
        return JSON.stringify(reconPayload(editor));
      }

      /**
       * Ask the core for the authoritative expected/difference/remaining and
       * the preview hashes. The pad account is resolved by the core; the client
       * only remembers it so later previews and the commit carry the same one.
       */
      async function previewRecon(editor) {
        const key = reconKey(editor);
        try {
          const preview = await postJson(API.reconPreview, reconPayload(editor));
          setReconEditor((previous) => {
            if (previous === null || reconKey(previous) !== key) return previous;
            const next = {
              ...previous,
              preview,
              expected: preview.expected,
              mode: preview.mode,
              padAccount: previous.padAccount || preview.defaultPadAccount || '',
              error: null,
            };
            // Keep the fingerprint aligned with the state that now carries the
            // resolved pad account, so the debounce effect does not fire again.
            return { ...next, previewFor: reconKey(next) };
          });
        } catch (failure) {
          setReconEditor((previous) => {
            if (previous === null || reconKey(previous) !== key) return previous;
            return { ...previous, preview: null, previewFor: key, error: describeFailure(t, failure) };
          });
        }
      }

      async function commitRecon(editor) {
        const payload = reconPayload(editor);
        setReconEditor({ ...editor, busy: 'commit', error: null });
        try {
          // The preview is an input to commit, not a step the user must press.
          // If the form changed since the last debounce, get a fresh one first.
          const preview = editor.preview !== null && editor.previewFor === reconKey(editor)
            ? editor.preview
            : await postJson(API.reconPreview, payload);
          if (!payload.padAccount && preview.defaultPadAccount) payload.padAccount = preview.defaultPadAccount;
          await postJson(API.reconCommit, {
            ...payload,
            mode: preview.mode,
            previewId: preview.previewId,
            ledgerRevision: preview.ledgerRevision,
            inputsHash: preview.inputsHash,
            directivesHash: preview.directivesHash,
            replaces: preview.replaces,
          });
          setReconEditor(null);
          setNotice(t('reconCommitted'));
          await load();
        } catch (failure) {
          setReconEditor((previous) => (previous === null ? previous : { ...previous, busy: null, error: describeFailure(t, failure) }));
        }
      }

      // Typing should not require a button: debounce one preview once the
      // inputs settle. A response for older inputs is ignored (key check).
      React.useEffect(() => {
        if (reconEditor === null || reconEditor.busy !== null || reconEditor.actual.trim() === '') return undefined;
        if (reconEditor.previewFor === reconKey(reconEditor)) return undefined;
        const timer = setTimeout(() => {
          void previewRecon(reconEditor);
        }, 400);
        return () => clearTimeout(timer);
      }, [reconEditor]);

      function updateRecon(patch) {
        setReconEditor((previous) => (previous === null ? previous : { ...previous, ...patch }));
      }

      function updateReconRow(index, patch) {
        setReconEditor((previous) => {
          if (previous === null) return previous;
          const rows = previous.rows.slice();
          rows[index] = { ...rows[index], ...patch };
          return { ...previous, rows };
        });
      }

      function addReconRow() {
        setReconEditor((previous) => (previous === null ? previous : { ...previous, rows: [...previous.rows, newAllocationRow(previous.asOf)] }));
      }

      function removeReconRow(index) {
        setReconEditor((previous) => (previous === null ? previous : { ...previous, rows: previous.rows.filter((_, at) => at !== index) }));
      }

      function openNewAccount() {
        setNewAccount({ account: 'Assets:Savings:Bank:', alias: '' });
        setNewAccountOpen(true);
      }

      function createAccount() {
        const account = newAccount.account.trim();
        if (account === '') {
          reportError(t('accountCanonical'));
          return;
        }
        const payload = { account, currency: ledgerCurrency };
        if (newAccount.alias.trim() !== '') payload.alias = newAccount.alias.trim();
        void runAction('account-open', async () => {
          await postJson(API.accountOpen, payload);
          setNewAccountOpen(false);
          setAccountSelected(account);
          setAccountDraft(null);
          return fill(t('accountAdded'), { name: account });
        }, '');
      }

      function approveDraft(draft) {
        if (draft.postings.some((posting) => posting.account === null)) {
          reportError(t('errorUnresolved'));
          return;
        }
        void runAction(`approve:${draft.id}`, async () => {
          const response = await postJson(API.approve, { id: draft.id });
          return response.committed
            ? fill(t('approvedWritten'), { file: response.draft?.approved?.file ?? '' })
            : t('approvedExisting');
        }, '');
      }

      function rejectDraft(draft) {
        void runAction(`reject:${draft.id}`, async () => {
          await postJson(API.reject, { id: draft.id, reason: rejectReasons[draft.id] ?? '' });
          return fill(t('rejectedNotice'), { id: draft.id });
        }, '');
      }

      function approveOperation(operation) {
        void runAction(`op-approve:${operation.id}`, async () => {
          await postJson(API.operationApprove, { id: operation.id, actor: 'panel' });
          return t('operationApproved');
        }, '');
      }

      function rejectOperation(operation) {
        void runAction(`op-reject:${operation.id}`, async () => {
          await postJson(API.operationReject, { id: operation.id, actor: 'panel' });
          return t('operationRejected');
        }, '');
      }

      function approveAllOperations() {
        void runAction('op-approve-all', async () => {
          const response = await postJson(API.operationApproveAll, {});
          const approved = response?.approved ?? 0;
          const failed = (response?.failed ?? []).length;
          const done = fill(t('approvedAllOps'), { count: approved });
          return failed > 0 ? `${done}；${fill(t('approveAllFailed'), { count: failed })}` : done;
        }, '');
      }

      function approveAllDrafts() {
        void runAction('draft-approve-all', async () => {
          const response = await postJson(API.draftApproveAll, {});
          const approved = response?.approved ?? 0;
          const skipped = (response?.skipped ?? []).length;
          return fill(t('approvedAllDrafts'), { count: approved, skipped });
        }, '');
      }

      function expandAccountAncestors(path) {
        const parts = path.split(':');
        setAccountExpanded((previous) => {
          const next = { ...previous };
          for (let index = 1; index < parts.length; index += 1) next[parts.slice(0, index).join(':')] = true;
          return next;
        });
      }

      function selectAccountNow(path) {
        setAccountSelected(path);
        setAccountDraft(null);
        setAccountPendingSelect(null);
        expandAccountAncestors(path);
      }

      function requestAccountSelect(account) {
        if (account.account === accountSelected) return;
        if (accountDirty) {
          setAccountPendingSelect(account.account);
          return;
        }
        selectAccountNow(account.account);
      }

      function toggleAccountExpanded(path, expanded) {
        setAccountExpanded((previous) => ({ ...previous, [path]: !expanded }));
      }

      function toggleAccountHidden() {
        const next = !accountShowHidden;
        setAccountShowHidden(next);
        if (!next && accountQuery.trim() === '' && selectedAccount !== null && (selectedAccount.implicit === true || selectedAccount.closed === true)) {
          setAccountSelected(null);
          setAccountDraft(null);
        }
      }

      function updateSelectedDraft(patch) {
        if (selectedDraft === null) return;
        setAccountDraft({ ...selectedDraft, ...patch });
      }

      function saveSelectedAccount(forceClear = false) {
        if (selectedAccount === null || selectedDraft === null || selectedReadonly) return;
        const alias = selectedDraft.alias.trim();
        if (alias === '' && (selectedAccount.alias ?? '') !== '' && !forceClear) {
          setAccountClearOpen(true);
          return;
        }
        if (selectedHasChildren && selectedDraft.period !== (selectedAccount.period ?? 'none')) return;
        const body = { account: selectedAccount.account };
        let changed = false;
        if (selectedDraft.period !== (selectedAccount.period ?? 'none')) {
          body.reconcile = selectedDraft.period;
          changed = true;
        }
        if (alias !== (selectedAccount.alias ?? '')) {
          if (alias === '') body.clear_alias = true;
          else body.alias = alias;
          changed = true;
        }
        if (!changed) {
          setActionError(null);
          setNotice(fill(t('saved'), { name: selectedAccount.name }));
          setAccountDraft(null);
          return;
        }
        void runAction(`account:${selectedAccount.account}`, async () => {
          await postJson(API.metadata, body);
          setAccountDraft(null);
          setAccountClearOpen(false);
          return fill(t('saved'), { name: selectedAccount.name });
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

      /** Resolve the host directory-picker Remote namespace on demand. */
      function resolveDirectoryPicker() {
        try {
          const picker = clientContext?.get('remote.directoryPicker');
          return typeof picker?.pick === 'function' ? picker : null;
        } catch {
          return null;
        }
      }

      /**
       * Read one directory level into the in-app browser.
       *
       * The browse capability is the fallback for hosts whose directory picker
       * resolves to `browse` (for example a headless Linux box without zenity);
       * `pick` then refuses and the panel lists directories itself.
       * @param {object} picker directory-picker Remote namespace.
       * @param {string | undefined} target absolute directory, or undefined for home.
       * @param {boolean} [fallbackHome] retry at home when `target` cannot be listed.
       * @returns {Promise<void>}
       */
      async function refreshDirectory(picker, target, fallbackHome = false) {
        setDirPicker((previous) => (previous === null ? previous : { ...previous, loading: true, error: null }));
        try {
          if (typeof picker.list !== 'function') throw new Error('directory listing is unavailable');
          const result = await picker.list(typeof target === 'string' && target !== '' ? target : undefined);
          if (result?.ok !== true) throw new Error(result?.error?.message ?? 'directory listing failed');
          const listing = result.value;
          if (listing === null || typeof listing !== 'object' || typeof listing.path !== 'string') {
            throw new Error('directory listing was malformed');
          }
          setDirPicker((previous) => (
            previous === null ? previous : { ...previous, listing, loading: false, error: null }
          ));
        } catch (failure) {
          if (fallbackHome && typeof target === 'string' && target !== '') {
            await refreshDirectory(picker, undefined);
            return;
          }
          setDirPicker((previous) => (
            previous === null
              ? previous
              : { ...previous, loading: false, error: fill(t('dirPickerFailed'), { message: failure?.message ?? '' }) }
          ));
        }
      }

      async function chooseSetupDirectory() {
        const picker = resolveDirectoryPicker();
        if (picker === null) {
          reportError(t('setupPickFailed'));
          return;
        }
        try {
          const result = await picker.pick();
          if (result?.ok === true) {
            if (typeof result.value === 'string' && result.value.trim() !== '') {
              setSetupForm((previous) => ({ ...previous, root: result.value }));
            }
            return;
          }
        } catch {
          // No native chooser: fall through to the in-app browser below.
        }
        setDirPicker({ picker, listing: null, loading: true, error: null, newName: '', busy: null });
        await refreshDirectory(picker, setupForm.root || setup?.root || undefined, true);
      }

      async function createDirectoryInPicker() {
        if (dirPicker === null || dirPicker.listing === null || dirPicker.busy !== null) return;
        const name = dirPicker.newName.trim();
        if (name === '' || typeof dirPicker.picker.createDirectory !== 'function') return;
        const parent = dirPicker.listing.path;
        setDirPicker((previous) => (previous === null ? previous : { ...previous, busy: 'create', error: null }));
        try {
          const result = await dirPicker.picker.createDirectory(parent, name);
          if (result?.ok !== true) throw new Error(result?.error?.message ?? 'create directory failed');
          const created = typeof result.value === 'string' && result.value !== '' ? result.value : parent;
          setDirPicker((previous) => (previous === null ? previous : { ...previous, busy: null, newName: '' }));
          await refreshDirectory(dirPicker.picker, created);
        } catch (failure) {
          setDirPicker((previous) => (
            previous === null
              ? previous
              : { ...previous, busy: null, error: fill(t('dirPickerCreateFailed'), { message: failure?.message ?? '' }) }
          ));
        }
      }

      function confirmDirectorySelection() {
        if (dirPicker === null || dirPicker.listing === null) return;
        const chosen = dirPicker.listing.path;
        setSetupForm((previous) => ({ ...previous, root: chosen }));
        setDirPicker(null);
      }

      /**
       * Open a fresh conversation in the ledger workspace and seed its composer.
       * Returns false when the Host navigation services are unavailable.
       */
      async function openConversationWithPrompt(workspaceId, prompt) {
        const navigation = clientContext?.get('uiWorkspace');
        const sessions = clientContext?.get('sessions');
        const conversation = clientContext?.get('conversation');
        if (typeof navigation?.openWorkspace !== 'function' || sessions === undefined || conversation === undefined) {
          return false;
        }
        let sessionId;
        await navigation.openWorkspace(workspaceId, (created) => { sessionId = created; });
        if (sessionId === undefined) return false;
        // Navigation already happened; seeding the composer stays best effort.
        try {
          const reference = sessions.retain(sessionId, { source: 'controllerOperation' });
          try {
            await Promise.race([
              reference.ready,
              new Promise((_, reject) => setTimeout(() => reject(new Error('session open timed out')), 3000)),
            ]);
            let scope = sessions.scope(sessionId);
            // The new Session's scope can materialize one frame after navigation.
            for (let attempt = 0; scope === undefined && attempt < 10; attempt += 1) {
              await new Promise((resolve) => setTimeout(resolve, 50));
              scope = sessions.scope(sessionId);
            }
            if (scope !== undefined) conversation.input.for(scope).setDraft(prompt);
          } finally {
            reference.release();
          }
        } catch (failure) {
          console.warn('ledger: seeding the starter prompt failed', failure);
        }
        return true;
      }

      function createLedger() {
        const title = setupForm.title.trim();
        if (title === '') {
          reportError(t('setupNameRequired'));
          return;
        }
        const root = setupForm.root.trim() || setup?.root || '';
        if (busyRef.current !== null) return;
        busyRef.current = 'init';
        setBusy('init');
        setActionError(null);
        setNotice(null);
        void (async () => {
          try {
            const response = await postJson(API.init, { title, root });
            const created = response?.value ?? {};
            const outcome = created.workspace;
            let workspaceId = outcome?.ok === true ? outcome.workspace?.workspaceId : undefined;
            // The Host registered the workspace during /init, but the client list can
            // still be stale; creating by path here merges the row before navigation.
            const workspaces = clientContext?.get('workspaces');
            if (typeof workspaces?.create === 'function' && typeof created.root === 'string' && created.root !== '') {
              try {
                const view = await workspaces.create({ path: created.root });
                workspaceId = view.workspaceId;
              } catch (failure) {
                console.warn('ledger: registering the workspace failed', failure);
              }
            }
            if (workspaceId !== undefined) {
              try {
                if (await openConversationWithPrompt(workspaceId, t('starterPrompt'))) return;
              } catch (failure) {
                // Navigation is best effort; creation still succeeded, so fall back to the panel.
                console.warn('ledger: opening the starter conversation failed', failure);
              }
            }
            setNotice(fill(t(created.existing === true ? 'setupOpened' : 'setupCreated'), { title: created.title ?? title }));
            await load();
          } catch (failure) {
            setActionError(describeFailure(t, failure));
          } finally {
            busyRef.current = null;
            setBusy(null);
          }
        })();
      }

      function openEntry() {
        setEntryPicker(null);
        setEntry({ kind: 'expense', date: today, payee: '', amount: '', category: '', source: '', narration: '' });
        setEntryOpen(true);
        setTab('review');
      }

      function updateEntry(patch) {
        setEntry((previous) => {
          // A native <select> can echo the same change again while its menu is
          // closing; returning the same state stops that from re-rendering in a loop.
          const changed = Object.keys(patch).some((key) => previous[key] !== patch[key]);
          return changed ? { ...previous, ...patch } : previous;
        });
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

      const header = h(
        'header',
        { style: S.head },
        h('span', { style: S.mark }, h(Glyph, { size: 28 })),
        h(
          'div',
          { style: S.headText },
          h('h1', { style: S.title }, t('title')),
        ),
        h(
          'div',
          { style: S.headMeta },
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
          renderDirectoryPicker(),
        ),
      );

      function renderReconEditor() {
        const editor = reconEditor;
        if (editor === null) return null;
        const preview = editor.preview;
        const stale = preview !== null && editor.previewFor !== reconKey(editor);
        const allocationAccounts = metadataAccounts.slice().sort((left, right) => left.name.localeCompare(right.name));
        const pickerQuery = reconAccountPicker?.query?.trim().toLowerCase() ?? '';
        const pickerAccounts = pickerQuery === ''
          ? allocationAccounts
          : allocationAccounts.filter((account) => `${account.name} ${account.account}`.toLowerCase().includes(pickerQuery));
        const mode = preview?.mode ?? editor.mode;
        const modeLabel = mode === 'update' ? t('reconModeUpdate') : t('reconModeCreate');
        // Difference is pure subtraction on the previewed expected balance, so
        // it updates while typing. The core still recomputes it on commit.
        const expectedText = preview?.expected ?? editor.expected ?? null;
        const actualScaled = editor.actual.trim() === '' ? null : parseScaledAmount(editor.actual);
        const expectedScaled = expectedText === null ? null : parseScaledAmount(expectedText);
        const differenceScaled = actualScaled === null || expectedScaled === null ? null : actualScaled - expectedScaled;
        const differenceText = differenceScaled === null ? '—' : formatScaledAmount(differenceScaled);
        const padAccount = preview?.defaultPadAccount ?? editor.padAccount ?? null;
        const padLabel = padAccount === null
          ? null
          : (metadataAccounts.find((account) => account.account === padAccount)?.name ?? padAccount);
        const remainingScaled = preview === null || preview.remaining == null ? null : parseScaledAmount(preview.remaining);
        const liabilityAccount = editor.account.startsWith('Liabilities:');
        // Allocation is only meaningful with a difference: a zero balance either
        // matches exactly or has no actual yet, so the whole allocation block
        // stays hidden until the difference is known and non-zero.
        const hasDifference = differenceScaled !== null && differenceScaled !== 0;
        const showPadHint = hasDifference && editor.rows.length === 0 && padLabel !== null;
        const showRemainingHint = editor.rows.length > 0 && !stale && remainingScaled !== null && remainingScaled !== 0 && padLabel !== null;
        return h(
          'div',
          { style: { ...S.card, marginBottom: 12 } },
          h(
            'div',
            { style: S.spread },
            h(
              'div',
              { style: S.grow },
              h('div', { style: S.name }, `${t('reconOpen')}: ${editor.name}`),
              h('div', { style: S.canonical }, editor.account),
            ),
            h('span', { style: S.row }, h(Badge, { tone: mode === 'update' ? 'due' : 'pending' }, modeLabel), h(Button, { onClick: () => setReconEditor(null), disabled: editor.busy !== null }, t('reconClose'))),
          ),
          h(
            'div',
            { style: { ...S.row, marginTop: 10, flexWrap: 'wrap' } },
            h(Field, { label: t('reconActual') }, h('input', { style: { ...S.input, ...S.amountInput }, inputMode: 'decimal', placeholder: '0.00', disabled: editor.busy !== null, value: editor.actual, onChange: (event) => updateRecon({ actual: event.target.value }) })),
            h(Field, { label: t('reconExpected') }, h('span', { style: S.mono }, expectedText ?? '—')),
            h(Field, { label: t('reconDifference') }, h('span', { style: S.mono }, differenceText)),
          ),
          liabilityAccount ? h('p', { style: S.hint }, t('liabilityNegativeHint')) : null,
          hasDifference
            ? h(
                'div',
                { style: { marginTop: 12 } },
                h('h3', { style: { ...S.sectionTitle, fontSize: 13 } }, t('reconAllocations')),
                showPadHint ? h('p', { style: S.hint }, fill(t('reconAutoPadHint'), { account: padLabel })) : null,
                editor.rows.length === 0
                  ? null
                  : h(
                      'div',
                      { style: S.tableScroll },
                      h(
                        'table',
                        { style: S.table },
                        h('thead', null, h('tr', null, h('th', { style: S.th }, t('accountName')), h('th', { style: S.th }, t('reconAmount')), h('th', { style: S.th }, t('reconDate')), h('th', { style: S.th }, t('reconNote')), h('th', { style: S.th }, ''))),
                        h(
                          'tbody',
                          null,
                          editor.rows.map((row, index) =>
                            h(
                              'tr',
                              { key: `recon-row-${index}` },
                              h('td', { style: S.td }, h(
                                'button',
                                {
                                  type: 'button',
                                  style: { ...S.input, width: '100%', textAlign: 'left', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                                  disabled: editor.busy !== null,
                                  onClick: () => setReconAccountPicker({ index, query: '' }),
                                },
                                row.account
                                  ? (allocationAccounts.find((account) => account.account === row.account)?.name ?? row.account)
                                  : t('reconChooseAccount'),
                              )),
                              h('td', { style: S.td }, h('input', { style: { ...S.input, ...S.amountInput }, inputMode: 'decimal', placeholder: '0.00', disabled: editor.busy !== null, value: row.amount, onChange: (event) => updateReconRow(index, { amount: event.target.value }) })),
                              h('td', { style: S.td }, h('input', { type: 'date', style: S.input, max: editor.asOf, disabled: editor.busy !== null, value: row.date ?? editor.asOf, onChange: (event) => updateReconRow(index, { date: event.target.value }) })),
                              h('td', { style: S.td }, h('input', { style: S.input, disabled: editor.busy !== null, value: row.note, onChange: (event) => updateReconRow(index, { note: event.target.value }) })),
                              h('td', { style: S.td }, h(Button, { variant: 'danger', onClick: () => removeReconRow(index), disabled: editor.busy !== null }, '×')),
                            ),
                          ),
                        ),
                      ),
                    ),
                h('div', { style: { ...S.row, marginTop: 8 } }, h(Button, { onClick: addReconRow, disabled: editor.busy !== null }, t('reconAddAllocation'))),
                showRemainingHint ? h('p', { style: S.hint }, fill(t('reconRemainingHint'), { amount: preview.remaining, account: padLabel })) : null,
              )
            : null,
          h(
            'div',
            { style: { ...S.row, marginTop: 10 } },
            h(Button, { variant: 'primary', onClick: () => commitRecon(editor), busy: editor.busy === 'commit', disabled: editor.busy !== null || editor.actual.trim() === '' }, editor.busy === 'commit' ? t('reconCommitting') : t('reconCommit')),
          ),
          editor.error ? h('div', { style: { ...S.alert, ...S.alertError }, role: 'alert' }, editor.error) : null,
          reconAccountPicker !== null
            ? h(
                Modal,
                {
                  title: t('reconChooseAccount'),
                  onClose: () => setReconAccountPicker(null),
                  footer: [h(Button, { key: 'cancel', onClick: () => setReconAccountPicker(null) }, t('entryCancel'))],
                },
                h(
                  'div',
                  { style: { display: 'grid', gap: 8 } },
                  h('input', {
                    autoFocus: true,
                    style: S.input,
                    placeholder: t('searchAccounts'),
                    value: reconAccountPicker.query,
                    onChange: (event) => setReconAccountPicker((previous) => (previous === null ? previous : { ...previous, query: event.target.value })),
                  }),
                  h(
                    'div',
                    { style: { display: 'grid', gap: 4, maxHeight: '52vh', overflow: 'auto' } },
                    pickerAccounts.length === 0
                      ? h('div', { style: S.empty }, t('noAccounts'))
                      : pickerAccounts.map((account) =>
                          h(
                            'button',
                            {
                              key: account.account,
                              type: 'button',
                              style: { ...S.input, display: 'grid', gap: 2, textAlign: 'left', cursor: 'pointer' },
                              onClick: () => {
                                updateReconRow(reconAccountPicker.index, { account: account.account });
                                setReconAccountPicker(null);
                              },
                            },
                            h('span', { style: S.name }, account.name),
                            h('span', { style: S.canonical }, account.account),
                          ),
                        ),
                  ),
                ),
              )
            : null,
        );
      }

      function renderReconcile() {
        const rows = [];
        for (const account of dueAccounts) {
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
                  h('div', { style: S.canonical }, account.account),
                ),
                h(Button, { variant: 'primary', onClick: () => openRecon(account), disabled: busy !== null }, t('reconOpen')),
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
            ),
          ),
          renderReconEditor(),
          dueAccounts.length === 0
            ? h('div', { style: S.empty }, reconciliationAccounts.length === 0 ? t('noPeriod') : t('allClear'))
            : h('div', { style: { display: 'grid', gap: 10 } }, rows),
          data.issues.length > 0 ? renderIssues() : null,
        );
      }

      function renderOperations() {
        if (pendingOperations.length === 0) return null;
        const cards = pendingOperations.map((operation) => {
          const blocked = operation.issues.length > 0;
          const kindName = operationKindName(t, operation.kind);
          return h(
            'div',
            { key: operation.id, style: S.card },
            h(
              'div',
              { style: S.spread },
              h(
                'div',
                { style: S.grow },
                h('div', { style: S.name }, operationSummary(t, operation)),
                kindName ? h('div', { style: S.canonical }, kindName) : null,
              ),
              h(Badge, { tone: 'pending' }, t('statusPending')),
            ),
            operation.reason
              ? h('div', { style: S.label }, `${t('rejectReason')}: ${operation.reason}`)
              : null,
            blocked
              ? h(
                  'div',
                  { style: { ...S.label, color: 'var(--dsw-alias-state-error-primary)' } },
                  operation.issues.map((issue) => issueText(t, issue)).join('；'),
                )
              : null,
            h(
              'div',
              { style: { ...S.row, gap: 8, marginTop: 8 } },
              h(
                Button,
                {
                  variant: 'primary',
                  onClick: () => approveOperation(operation),
                  busy: busy === `op-approve:${operation.id}`,
                  disabled: busy !== null || blocked || operation.proposable === false,
                },
                t('operationApprove'),
              ),
              h(
                Button,
                {
                  variant: 'outline',
                  onClick: () => rejectOperation(operation),
                  busy: busy === `op-reject:${operation.id}`,
                  disabled: busy !== null,
                },
                t('operationReject'),
              ),
            ),
          );
        });
        return h(
          'div',
          { style: { display: 'grid', gap: 10, marginBottom: 16 } },
          h(
            'div',
            { style: S.spread },
            h(
              'div',
              { style: S.grow },
              h('h3', { style: S.sectionTitle }, `${t('operationsTitle')} (${pendingOperations.length})`),
            ),
            h(
              Button,
              {
                variant: 'primary',
                onClick: approveAllOperations,
                busy: busy === 'op-approve-all',
                disabled: busy !== null || pendingOperations.some((operation) => operation.issues.length > 0),
              },
              fill(t('approveAllOps'), { count: pendingOperations.length }),
            ),
          ),
          h('div', { style: { display: 'grid', gap: 10 } }, cards),
        );
      }

      function renderReview() {
        const cards = pendingDrafts.map((draft) => {
          const postings = draft.postings;
          const hasUnresolved = postings.some((posting) => posting.account === null);
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
                draftMetaLine(t, draft) ? h('div', { style: S.canonical }, draftMetaLine(t, draft)) : null,
                draft.narration && draft.narration !== draft.payee
                  ? h('div', { style: { ...S.canonical, overflowWrap: 'anywhere' } }, draft.narration)
                  : null,
              ),
              h(Badge, { tone: 'pending' }, t('statusPending')),
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
                    h(
                      'span',
                      null,
                      posting.account ?? `${t('unresolved')}: ${posting.suggested || '—'}`,
                    ),
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
            { style: S.spread },
            h(
              'div',
              { style: S.grow },
              h('h2', { style: S.sectionTitle }, `${t('reviewTitle')} (${pendingDrafts.length})`),
            ),
            h(
              'div',
              { style: S.row },
              h(Button, { variant: 'outline', onClick: openEntry, disabled: busy !== null }, t('manualEntry')),
              pendingDrafts.length > 0
                ? h(
                    Button,
                    {
                      variant: 'primary',
                      onClick: approveAllDrafts,
                      busy: busy === 'draft-approve-all',
                      disabled: busy !== null,
                    },
                    fill(t('approveAllDrafts'), { count: pendingDrafts.length }),
                  )
                : null,
            ),
          ),
          pendingDrafts.length > 0 ? h('p', { style: S.hint }, t('draftReadonlyHint')) : null,
          entryOpen ? renderEntryForm() : null,
          renderOperations(),
          pendingDrafts.length === 0 ? h('div', { style: S.empty }, t('pendingEmpty')) : h('div', { style: { display: 'grid', gap: 10 } }, cards),
        );
      }

      function renderAccounts() {
        const query = accountQuery.trim();
        const displayTree = accountTree.filter((node) => countTreeLeaves(node) > 0);
        const isExpanded = (node, depth) => {
          if (Object.hasOwn(accountExpanded, node.path)) return accountExpanded[node.path] === true;
          if (query !== '') return node.children.length > 0;
          return depth === 0 && countTreeDue(node) > 0;
        };
        const renderNode = (node, depth) => {
          const hasChildren = node.children.length > 0;
          const expanded = hasChildren && isExpanded(node, depth);
          const selected = node.account !== null && node.account.account === accountSelected;
          const position = node.account ? balanceByAccount.get(node.account.account) : undefined;
          return h(
            'div',
            { key: node.key, role: 'treeitem', 'aria-expanded': hasChildren ? expanded : undefined },
            h(
              'div',
              { style: { ...S.treeRow, ...(selected ? S.treeRowSelected : null), paddingLeft: depth * 12 } },
              hasChildren
                ? h(
                    'button',
                    {
                      type: 'button',
                      style: S.treeToggle,
                      'aria-label': expanded ? 'collapse' : 'expand',
                      onClick: () => toggleAccountExpanded(node.path, expanded),
                    },
                    expanded ? '▾' : '▸',
                  )
                : h('span', { style: { width: 16, minWidth: 16 } }),
              h(
                'button',
                {
                  type: 'button',
                  style: S.treeLabel,
                  title: node.account ? node.account.account : node.path,
                  onClick: () => (node.account ? requestAccountSelect(node.account) : toggleAccountExpanded(node.path, expanded)),
                },
                h('span', { style: { ...S.name, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, node.label),
                node.account && node.account.implicit ? h(Badge, { tone: 'scheduled' }, t('implicit')) : null,
                node.account && node.account.closed ? h(Badge, { tone: 'rejected' }, t('closed')) : null,
                node.account && node.hidden && (accountShowHidden || query !== '') ? h(Badge, { tone: 'scheduled' }, t('accountHiddenBadge')) : null,
                node.account && node.account.unreconciled
                  ? h('span', { style: { ...S.treeDot, background: 'var(--dsw-alias-state-warn-primary)' }, title: t('reconUnreconciled') })
                  : null,
                node.account && !node.account.unreconciled && (node.account.status === 'due' || node.account.status === 'overdue')
                  ? h('span', {
                      style: {
                        ...S.treeDot,
                        background: node.account.status === 'overdue' ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-state-warn-primary)',
                      },
                      title: statusLabel(t, node.account.status),
                    })
                  : null,
              ),
              position !== undefined
                ? h('span', { style: S.treeAmount, title: formatMoney(position.amount, position.currency) }, formatMoney(position.amount, position.currency))
                : null,
            ),
            hasChildren && expanded ? h('div', { role: 'group' }, node.children.map((child) => renderNode(child, depth + 1))) : null,
          );
        };

        const renderDetail = () => {
          if (selectedAccount === null || selectedDraft === null) {
            return h('div', { style: S.empty }, t('accountSelectHint'));
          }
          const account = selectedAccount;
          const root = account.account.split(':')[0];
          const reconcileable = root === 'Assets' || root === 'Liabilities';
          // The alias is edited inline in the title, so the edit block only
          // remains when there is something else to edit or a pending change.
          const showEditSection = !selectedReadonly && (reconcileable || accountDirty);
          const currencies = account.currencies ?? [];
          // A single-currency ledger does not need a currency field on every
          // account; surface it only when it differs from the operating one.
          const showCurrency = currencies.length > 1 || (currencies.length === 1 && currencies[0] !== ledgerCurrency);
          const typeLabel = PARENT_LABELS[root] ?? root;
          // Audit details stay reachable on hover instead of occupying a row.
          const detailTitle = [
            account.file ? `${account.file}:${account.line}` : null,
            account.openDate && !account.implicit ? `${t('accountOpenDate')} ${account.openDate}` : null,
          ].filter(Boolean).join(' · ');
          return h(
            'div',
            { style: { display: 'grid', gap: 12 } },
            h(
              'div',
              { style: S.spread },
              h(
                'div',
                { style: S.grow },
                selectedReadonly
                  ? h('div', { style: { ...S.name, fontSize: 16, fontWeight: 700 } }, account.name)
                  : aliasEditing === account.account
                    ? h('input', {
                        // The resting state is a title; only the active editor
                        // gets the underline, so no box appears in normal view.
                        style: {
                          ...S.name,
                          fontFamily: 'inherit',
                          fontSize: 16,
                          fontWeight: 700,
                          lineHeight: 1.4,
                          width: '100%',
                          maxWidth: 380,
                          padding: '0 2px',
                          border: 0,
                          borderBottom: '1px solid var(--dsw-alias-brand-primary)',
                          borderRadius: 0,
                          background: 'transparent',
                          outline: 'none',
                          boxSizing: 'border-box',
                        },
                        autoFocus: true,
                        maxLength: 40,
                        placeholder: account.account,
                        'aria-label': t('alias'),
                        disabled: busy !== null,
                        value: selectedDraft.alias,
                        onFocus: (event) => event.target.select(),
                        onBlur: () => setAliasEditing(null),
                        onChange: (event) => updateSelectedDraft({ alias: event.target.value }),
                        onKeyDown: (event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            setAliasEditing(null);
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            updateSelectedDraft({ alias: account.alias ?? '' });
                            setAliasEditing(null);
                          }
                        },
                      })
                    : h(
                        'button',
                        {
                          type: 'button',
                          style: {
                            ...S.name,
                            fontFamily: 'inherit',
                            fontSize: 16,
                            fontWeight: 700,
                            lineHeight: 1.4,
                            appearance: 'none',
                            background: 'transparent',
                            border: 0,
                            borderRadius: 0,
                            padding: '0 2px',
                            textAlign: 'left',
                            cursor: 'text',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                          title: t('accountEditAlias'),
                          disabled: busy !== null,
                          onClick: () => setAliasEditing(account.account),
                        },
                        selectedDraft.alias.trim() !== '' ? selectedDraft.alias : account.account,
                      ),
                h(
                  'div',
                  { style: S.canonical, title: detailTitle || undefined },
                  showCurrency ? `${account.account} · ${currencies.join(', ')}` : account.account,
                ),
              ),
              h(
                'div',
                { style: S.row },
                !selectedReadonly && !selectedHasChildren && reconcileable
                  ? h(
                      Button,
                      {
                        variant: 'primary',
                        onClick: () => openRecon(account),
                        disabled: busy !== null || (reconEditor !== null && reconEditor.account === account.account),
                      },
                      reconEditor !== null && reconEditor.account === account.account
                        ? t('reconEditing')
                        : account.coveredThrough === today ? t('reconUpdate') : t('reconOpen'),
                    )
                  : null,
                h(Badge, { tone: 'scheduled' }, typeLabel),
                account.closed ? h(Badge, { tone: 'rejected' }, t('closed')) : null,
                account.implicit ? h(Badge, { tone: 'scheduled' }, t('implicit')) : null,
              ),
            ),
            selectedReadonly ? h('div', { style: { ...S.alert, ...S.alertInfo } }, t('accountReadonly')) : null,
            showEditSection
              ? h(
                  'div',
                  { style: { display: 'grid', gap: 10 } },
                  reconcileable
                    ? h(
                        Field,
                        { label: t('period') },
                        h(
                          'div',
                          { style: S.row },
                          PERIODS.map((period) =>
                            h(
                              Button,
                              {
                                key: period,
                                variant: selectedDraft.period === period ? 'primary' : 'outline',
                                disabled: periodDisabled || busy !== null,
                                onClick: () => updateSelectedDraft({ period }),
                              },
                              periodLabel(t, period),
                            ),
                          ),
                        ),
                      )
                    : null,
                  reconcileable && selectedHasChildren ? h('p', { style: S.hint }, t('accountHasChildren')) : null,
                  h(
                    'div',
                    { style: S.row },
                    h(
                      Button,
                      {
                        variant: 'primary',
                        onClick: () => saveSelectedAccount(false),
                        busy: busy === `account:${account.account}`,
                        disabled: !accountDirty || busy !== null,
                      },
                      busy === `account:${account.account}` ? t('saving') : t('save'),
                    ),
                    h(
                      Button,
                      { onClick: () => setAccountDraft(null), disabled: busy !== null || !accountDirty },
                      t('entryCancel'),
                    ),
                  ),
                )
              : null,
            reconEditor !== null && reconEditor.account === account.account ? renderReconEditor() : null,
          );
        };

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
            ),
            h('span', { style: S.label }, fill(t('quota'), { count: accounts.length })),
          ),
          h(
            'div',
            { style: S.spread },
            h(
              'div',
              { style: S.row },
              h('input', {
                style: { ...S.input, width: 280 },
                placeholder: t('searchAccounts'),
                'aria-label': t('searchAccounts'),
                value: accountQuery,
                onChange: (event) => {
                  setAccountQuery(event.target.value);
                  setAccountExpanded({});
                },
              }),
              hiddenCount > 0
                ? h(
                    Button,
                    { variant: 'outline', onClick: toggleAccountHidden, disabled: busy !== null },
                    accountShowHidden ? t('accountHideHidden') : fill(t('accountShowHidden'), { count: hiddenCount }),
                  )
                : null,
            ),
            h(Button, { variant: 'primary', onClick: openNewAccount, disabled: busy !== null }, t('addAccount')),
          ),
          data.issues.length > 0
            ? h(
                'div',
                { style: { display: 'grid', gap: 4 } },
                data.issues.slice(0, 8).map((issue, index) => h('div', { key: index, style: { ...S.issue, fontSize: 12 } }, issueText(t, issue))),
              )
            : null,
          displayTree.length === 0
            ? h('div', { style: S.empty }, t('noAccounts'))
            : h(
                'div',
                { style: S.accountLayout },
                h(
                  'div',
                  { style: S.accountTreePanel, role: 'tree' },
                  displayTree.map((node) => renderNode(node, 0)),
                ),
                h('div', { style: S.accountDetailPanel }, renderDetail()),
              ),
          accountClearOpen
            ? h(
                Modal,
                {
                  title: t('accountClearTitle'),
                  onClose: () => setAccountClearOpen(false),
                  footer: [
                    h(Button, { key: 'cancel', onClick: () => setAccountClearOpen(false), disabled: busy !== null }, t('entryCancel')),
                    h(
                      Button,
                      {
                        key: 'confirm',
                        variant: 'danger',
                        onClick: () => saveSelectedAccount(true),
                        busy: busy !== null,
                        disabled: busy !== null,
                      },
                      t('accountClear'),
                    ),
                  ],
                },
                h(
                  'div',
                  { style: { display: 'grid', gap: 8 } },
                  h('p', { style: S.hint }, t('accountClearConfirm')),
                  actionError ? h('div', { style: { ...S.alert, ...S.alertError }, role: 'alert' }, actionError) : null,
                ),
              )
            : null,
          accountPendingSelect !== null
            ? h(
                Modal,
                {
                  title: t('accountUnsavedTitle'),
                  onClose: () => setAccountPendingSelect(null),
                  footer: [
                    h(Button, { key: 'cancel', onClick: () => setAccountPendingSelect(null), disabled: busy !== null }, t('entryCancel')),
                    h(
                      Button,
                      {
                        key: 'confirm',
                        variant: 'danger',
                        onClick: () => selectAccountNow(accountPendingSelect),
                        disabled: busy !== null,
                      },
                      t('accountDiscardConfirm'),
                    ),
                  ],
                },
                h('p', { style: S.hint }, t('accountDiscard')),
              )
            : null,
          newAccountOpen
            ? h(
                Modal,
                {
                  title: t('addAccount'),
                  onClose: () => setNewAccountOpen(false),
                  footer: [
                    h(Button, { key: 'cancel', onClick: () => setNewAccountOpen(false), disabled: busy !== null }, t('entryCancel')),
                    h(
                      Button,
                      {
                        key: 'save',
                        variant: 'primary',
                        onClick: createAccount,
                        busy: busy === 'account-open',
                        disabled: busy !== null,
                      },
                      busy === 'account-open' ? t('saving') : t('save'),
                    ),
                  ],
                },
                h(
                  'div',
                  { style: { display: 'grid', gap: 10 } },
                  h(Field, { label: t('accountCanonical') }, h('input', {
                    style: S.input,
                    placeholder: 'Assets:Savings:Bank:BOC0814',
                    disabled: busy !== null,
                    value: newAccount.account,
                    onChange: (event) => setNewAccount((previous) => ({ ...previous, account: event.target.value })),
                  })),
                  h(Field, { label: t('alias') }, h('input', {
                    style: S.input,
                    placeholder: t('aliasPlaceholder'),
                    disabled: busy !== null,
                    value: newAccount.alias,
                    onChange: (event) => setNewAccount((previous) => ({ ...previous, alias: event.target.value })),
                  })),
                  actionError ? h('div', { style: { ...S.alert, ...S.alertError }, role: 'alert' }, actionError) : null,
                ),
              )
            : null,
        );
      }

      function renderEngineSetup() {
        return h(
          'section',
          { style: S.panel },
          h(
            'div',
            { style: S.card },
            h('h2', { style: S.sectionTitle }, t('engineTitle')),
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
            ),
            h(
              'div',
              { style: { display: 'grid', gap: 4, minWidth: 0 } },
              h('span', { style: S.label }, t('setupPath')),
              h(
                'div',
                { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                h(
                  'span',
                  { style: { ...S.canonical, fontSize: 12, overflowWrap: 'anywhere', flex: '1 1 240px', minWidth: 0 } },
                  setupForm.root,
                ),
                h(
                  Button,
                  { onClick: chooseSetupDirectory, disabled: busy !== null },
                  t('setupBrowse'),
                ),
              ),
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
          ),
        );
      }

      function renderDirectoryPicker() {
        if (dirPicker === null) return null;
        const listing = dirPicker.listing;
        const busy = dirPicker.busy !== null;
        const entries = (listing?.entries ?? []).filter((entry) => entry.hidden !== true);
        const allCrumbs = listing?.crumbs ?? [];
        const homeIndex = listing === null ? -1 : allCrumbs.findIndex((crumb) => crumb.path === listing.home);
        const crumbs = homeIndex === -1
          ? allCrumbs
          : [{ name: t('dirPickerHome'), path: listing.home, hidden: false }, ...allCrumbs.slice(homeIndex + 1)];
        return h(
          Modal,
          {
            title: t('dirPickerTitle'),
            onClose: () => setDirPicker(null),
            footer: [
              h(Button, { key: 'cancel', onClick: () => setDirPicker(null) }, t('dirPickerCancel')),
              h(
                Button,
                {
                  key: 'choose',
                  variant: 'primary',
                  onClick: confirmDirectorySelection,
                  disabled: listing === null || busy,
                },
                t('dirPickerHere'),
              ),
            ],
          },
          dirPicker.error !== null
            ? h(
                'div',
                { style: { ...S.alert, ...S.alertError }, role: 'alert' },
                h('span', null, dirPicker.error),
              )
            : null,
          crumbs.length > 0
            ? h(
                'div',
                { style: S.dirCrumbs },
                crumbs.map((crumb) => h(
                  'button',
                  {
                    key: crumb.path,
                    type: 'button',
                    style: S.dirCrumb,
                    title: crumb.path,
                    onClick: () => { void refreshDirectory(dirPicker.picker, crumb.path); },
                  },
                  crumb.name,
                )),
              )
            : null,
          dirPicker.loading
            ? h('div', { style: { ...S.empty, minHeight: 96 } }, t('dirPickerLoading'))
            : h(
                'div',
                { style: S.dirList },
                entries.length === 0
                  ? h('div', { style: S.hint }, t('dirPickerEmpty'))
                  : entries.map((entry) => h(
                      'button',
                      {
                        key: entry.path,
                        type: 'button',
                        style: S.dirRow,
                        title: entry.path,
                        onClick: () => { void refreshDirectory(dirPicker.picker, entry.path); },
                      },
                      h('span', { 'aria-hidden': true }, '▸'),
                      h('span', { style: { overflowWrap: 'anywhere', minWidth: 0 } }, entry.name),
                    )),
              ),
          listing?.truncated === true ? h('p', { style: S.hint }, t('dirPickerTruncated')) : null,
          h(
            'div',
            { style: S.row },
            h('input', {
              style: { ...S.input, flex: '1 1 160px' },
              value: dirPicker.newName,
              placeholder: t('dirPickerCreate'),
              disabled: busy || listing === null,
              onChange: (event) => setDirPicker((previous) => (
                previous === null ? previous : { ...previous, newName: event.target.value }
              )),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void createDirectoryInPicker();
                }
              },
            }),
            h(
              Button,
              {
                onClick: () => { void createDirectoryInPicker(); },
                disabled: busy || listing === null || dirPicker.newName.trim() === '',
              },
              t('dirPickerCreateAction'),
            ),
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
                  onChange: (event) => { setEntryPicker(null); updateEntry({ kind: event.target.value, category: '', source: '' }); },
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
                'button',
                {
                  type: 'button',
                  style: { ...S.input, minWidth: 180, textAlign: 'left', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                  disabled: busy !== null,
                  onClick: () => setEntryPicker({ field: 'category', query: '' }),
                },
                entry.category || t('entryChooseCategory'),
              ),
            ),
            h(
              Field,
              { label: t('entrySource') },
              h(
                'button',
                {
                  type: 'button',
                  style: { ...S.input, minWidth: 180, textAlign: 'left', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                  disabled: busy !== null,
                  onClick: () => setEntryPicker({ field: 'source', query: '' }),
                },
                entry.source || t('entryChooseSource'),
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
          entryPicker !== null ? renderEntryPicker() : null,
        );
      }

      function renderEntryPicker() {
        const field = entryPicker.field;
        const options = field === 'source' ? entrySourceOptions : entryCategoryOptions;
        const query = entryPicker.query.trim().toLowerCase();
        const filtered = query === ''
          ? options
          : options.filter((account) => `${account.name} ${account.account}`.toLowerCase().includes(query));
        return h(
          Modal,
          {
            title: field === 'source' ? t('entrySource') : t('entryCategory'),
            onClose: () => setEntryPicker(null),
            footer: [h(Button, { key: 'cancel', onClick: () => setEntryPicker(null) }, t('entryCancel'))],
          },
          h('input', {
            autoFocus: true,
            style: S.input,
            placeholder: t('searchAccounts'),
            value: entryPicker.query,
            onChange: (event) => setEntryPicker((previous) => (
              previous === null ? previous : { ...previous, query: event.target.value }
            )),
          }),
          h(
            'div',
            { style: { display: 'grid', gap: 4, maxHeight: '52vh', overflow: 'auto' } },
            filtered.length === 0
              ? h('div', { style: S.empty }, t('noAccounts'))
              : filtered.map((account) => h(
                  'button',
                  {
                    key: account.account,
                    type: 'button',
                    style: { ...S.input, display: 'grid', gap: 2, textAlign: 'left', cursor: 'pointer' },
                    onClick: () => {
                      updateEntry({ [field]: account.name });
                      setEntryPicker(null);
                    },
                  },
                  h('span', { style: S.name }, account.name),
                  h('span', { style: S.canonical }, account.account),
                )),
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
        clientContext = ctx;
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
