# Todo Organization Rules / Todo 整理规则

## 1. Purpose / 用途

FocusDock's Todo window is not a notebook and not an email summary. It is a compact reminder area near the top-right corner of the desktop.

FocusDock 的 Todo 窗口不是笔记本，也不是邮件摘要。它是桌面右上角附近的一块简洁提醒区域。

`todo.md` should only contain:

`todo.md` 只应该包含：

- Things the user truly needs to do.
- 用户确实需要去做的事情。
- Events the user has already confirmed they will attend.
- 用户已经确认会参加的活动。
- Items with a clear date or deadline.
- 有明确日期或截止时间的事项。
- Short actions that require the user to actively confirm something.
- 需要用户主动确认的简短行动项。

Do not put full email text, event background, link explanations, or promotional copy into Todo. That context belongs in a daily brief or a private log.

不要把完整邮件正文、活动背景、链接解释或推广文案放进 Todo。这些背景信息应该放在每日早报或私有日志中。

## 2. Todo Writing / Todo 写法

Todos should be short and readable at a glance.

Todo 应该短小，并且一眼能看懂。

Recommended format:

推荐格式：

`Project: action/keyword @YYYY-MM-DD`

Examples / 示例：

- `BIA: Welcome Night 5-8 @2026-08-24`
- `BCSSA: Boba Run @2026-08-27`
- `Bear Chat: RA 5:20 @2026-09-05`
- `RecWell: sign Waiver`
- `GBO: ask OL/BayPass`

Not recommended:

不推荐：

- `BIA Welcome Night is a new-student event with Chinese food, club introductions, Q&A, and games, so remember to bring the email for entry that day`

Reason: it is too long, fills the small window, and hides the next action.

原因：它太长，会占满小窗口，也会让下一步行动不清楚。

## 3. Inbox / Todo / Done

`todo.md` must preserve the three English section names `Inbox`, `Todo`, and `Done`, because the app reads tasks by these headings.

`todo.md` 必须保留 `Inbox`、`Todo` 和 `Done` 这三个英文分区名，因为 App 会根据这些标题读取任务。

- `Todo`: items with a clear date, clear action, and clear commitment.
- `Todo`：有明确日期、明确行动和明确承诺的事项。
- `Inbox`: information that is still uncertain, missing a date, or needs confirmation.
- `Inbox`：仍不确定、缺少日期，或需要确认的信息。
- `Done`: completed tasks.
- `Done`：已完成任务。
- `archive.md`: older completed tasks cleaned out of Done.
- `archive.md`：从 Done 清理出去的较早已完成任务。

Do not delete a task just because it is completed. Move it to Done first.

不要因为任务完成就直接删除。应先移动到 Done。

## 4. Gmail Organization / Gmail 整理原则

Gmail should not directly pollute the Todo list.

Gmail 内容不应该直接污染 Todo 列表。

A better workflow:

更好的流程：

1. Read emails first.
2. 先阅读邮件。
3. Generate a daily brief.
4. 生成每日早报。
5. Sort emails into today, approaching deadlines, needs confirmation, optional events, trash/ignore, and candidate Todo items.
6. 将邮件整理为今天、临近截止、需要确认、可选活动、垃圾/忽略和 Todo 候选。
7. Let the user decide which candidates should enter Todo.
8. 让用户决定哪些候选项应该进入 Todo。
9. Only very certain must-act items may be added to Todo automatically.
10. 只有非常确定的必做事项才可以自动加入 Todo。

Content that does not go into Todo by default:

默认不放进 Todo 的内容：

- Newsletters.
- 新闻简报。
- General promotions.
- 普通推广。
- Generic job recommendations.
- 泛泛的职位推荐。
- Student discount ads.
- 学生折扣广告。
- School notices with no clear action.
- 没有明确行动的学校通知。
- Resources that merely "seem possibly useful."
- 只是“看起来可能有用”的资源。

## 5. Daily Brief Format / 每日早报格式

The daily brief should help the user understand the most important items for today and the near future within about 30 seconds.

每日早报应该帮助用户在大约 30 秒内理解今天和近期最重要的事项。

Fixed structure:

固定结构：

- `## Today`
- `## Approaching Deadlines`
- `## Needs Confirmation`
- `## Optional Events`
- `## Trash / Ignore`
- `## Todo Candidates`

Format requirements:

格式要求：

- All section headings must use level-two headings: `## Section Name`.
- 所有分区标题都必须使用二级标题：`## Section Name`。
- Normal sections must use numbered lists in the form `1. ...`.
- 普通分区必须使用 `1. ...` 形式的编号列表。
- Do not use `- ...` or `* ...` bullet lists in normal sections.
- 普通分区不要使用 `- ...` 或 `* ...` 项目符号列表。
- `Todo Candidates` must be numbered, and each candidate must wrap the short Todo in backticks.
- `Todo Candidates` 必须使用编号列表，并且每个候选 Todo 都要用反引号包起来。

Example / 示例：

```markdown
1. `Project: action/keyword @YYYY-MM-DD`
```

The daily brief may be more detailed than Todo, but it should not become a retelling of emails.

每日早报可以比 Todo 更详细，但不应该变成邮件复述。

## 6. Candidate Rules / 候选项规则

Candidate Todo priority, from highest to lowest:

Todo 候选优先级从高到低如下：

1. Things the user has already signed up for, reserved, submitted, purchased, or confirmed.
2. 用户已经注册、预约、提交、购买或确认的事项。
3. Required or semi-required school items, such as forms, bills, training, and official appointments.
4. 必做或半必做的学校事项，例如表格、账单、培训和官方预约。
5. Near-term choices that affect scheduling.
6. 会影响日程安排的近期选择。
7. High-value optional events happening soon.
8. 近期发生的高价值可选活动。
9. Resources strongly related to the user's current identity or situation.
10. 与用户当前身份或处境高度相关的资源。
11. General promotions, generic job recommendations, and low-value newsletters.
12. 普通推广、泛泛的职位推荐和低价值简报。

Candidates must be numbered and written as short Todos.

候选项必须编号，并写成简短 Todo。

## 7. Optional Events / 可选活动

Optional events should not be judged only by whether the user has registered.

判断可选活动时，不应该只看用户是否已经注册。

An event may enter Todo candidates if it:

如果一个活动符合以下条件，可以进入 Todo 候选：

- Happens within the next 1-3 days.
- 发生在未来 1 到 3 天内。
- Has a clear time and location.
- 有明确时间和地点。
- Is free, low-cost, and on campus.
- 免费或低成本，并且在校园内。
- Helps with new-student adjustment, campus resources, social connection, career exploration, or academic exploration.
- 有助于新生适应、校园资源了解、社交连接、职业探索或学术探索。

It is still only a candidate, not a mandatory task that should be automatically added to Todo.

它仍然只是候选项，不是应该自动加入 Todo 的必做任务。

## 8. Avoid Duplicates / 避免重复

If an item is already in `todo.md`, the daily brief may mention it, but it should not appear again under `Todo Candidates`.

如果某个事项已经在 `todo.md` 中，每日早报可以提醒它，但不应该再次放进 `Todo Candidates`。

## 9. Job and Internship Emails / 求职和实习邮件

Handshake, job recommendations, and career newsletters should be summarized briefly by default and not placed directly into Todo.

Handshake、职位推荐和职业简报默认只做简短总结，不直接放进 Todo。

They should enter candidates only when one condition is met:

只有满足以下条件之一时，它们才应该进入候选：

- The opportunity is clearly related to the user's direction.
- 机会与用户方向明确相关。
- There is a clear deadline.
- 有明确截止日期。
- The email explicitly says the user is a strong or top applicant.
- 邮件明确说用户是 strong applicant 或 top applicant。
- The user previously expressed interest in applying.
- 用户之前表达过申请兴趣。

Write candidates as exploration actions, not commitments.

候选项应写成探索行动，而不是承诺。

Example / 示例：

`Handshake: review ALC internship @2026-09-17`

## 10. General Principle / 总原则

Keep Todo clean, and let the daily brief carry the background.

保持 Todo 干净，让每日早报承载背景信息。

- Todo tells the user what to do.
- Todo 告诉用户要做什么。
- The daily brief tells the user why something is worth noticing.
- 每日早报告诉用户为什么某件事值得注意。
- Private logs record detailed development and organization notes.
- 私有日志记录详细开发和整理记录。
- GitHub-facing documents should be English/Chinese bilingual.
- 面向 GitHub 上传的说明文档应使用中英双语。
