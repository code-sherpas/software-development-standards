# Pre-Merge Gates

## Goal

Before a change enters the main branch, five gates must hold. They are hard gates, not formalities: each one covers a failure that no automated check in a normal project ever looks at.

The gates are executed by whoever *integrates* the change, not by whoever wrote it. A report from the author, from a previous session, or from another agent is evidence about their run, not yours.

## What Counts as In Scope

Every route into the main branch, without exception:

- merging a pull request or merge request, or asking the platform to merge one;
- committing or pushing directly to the main branch in trunk-based mode;
- fast-forwarding, rebasing or cherry-picking commits onto the main branch, locally or remotely.

Nothing in a repository enforces these gates. A platform with no branch protection offers a green merge button for a change that is behind, red, or still running. The rule lives in the standard, not in the platform.

## Gate 1: The Change Is Ready to Merge

**Do not merge a pull request — and do not ask the platform to merge it for you — unless all seven conditions hold:**

1. **The head already contains the tip of the main branch.** A branch cut before the current main was validated against a base that no longer exists.
2. **Every check has concluded successfully.** Not pending, not failing, not cancelled, not skipped.
3. **You have exercised the change yourself, locally** — its pre-merge plan if it has one, and by hand in the running application unless it is evident that the change cannot introduce a regression, even with no plan written.
4. **If the change migrates already-stored data, you have run the migration yourself** against a dataset representing the variety of possible initial states, and verified the resulting data.
5. **If the change can leave data behind that nothing will need again, it ships the mechanism that removes it** — and you have seen that mechanism delete something.
6. **The diff is the change you think it is.** Not roughly — its file count and its deletions match what the change claims to do.
7. **Every comment, suggestion or request the review raised has been read and attended to.** Attended to means acted on, or answered saying why not — by you, having read it. A thread marked resolved is not evidence of that, and neither is one gone outdated on its own; a bot's comment counts like anyone's, and green checks are not an answer to any of them, since the comment exists precisely where a check did not look.

Conditions 3, 4 and 5 are the gates below, and they are verified by having done them. Verify 1, 2, 6 and 7 explicitly before merging.

### Verifying conditions 1, 2, 6 and 7 on GitHub

```bash
# 1. Is the head up to date with main? `behind_by` must be 0.
gh api repos/{owner}/{repo}/compare/main...<branch> --jq .behind_by

# …or locally: exit 0 means main's tip is already in the branch.
git fetch origin && git merge-base --is-ancestor origin/main origin/<branch>

# 2. Have all checks passed? exit 0 = all passed, 8 = some pending, 1 = some failed.
gh pr checks <pr-number>

# 6. Is the diff the size and shape the change claims? Read the three numbers.
gh pr view <pr-number> --json additions,deletions,changedFiles

# …and when they surprise you, see where the extra files came from:
git diff --name-status $(git merge-base origin/main <branch>) <branch>

# 7. What did the review actually say? `gh pr view` does not show any of this —
# inline review comments live on their own endpoint, and `--json comments`
# answers `0` while `--json reviews` returns the reviews with an EMPTY body.
gh api repos/{owner}/{repo}/pulls/<pr-number>/comments \
  --jq '.[] | "\(.user.login)\t\(.path)\t\(.body[0:200] | gsub("\n";" "))"'

# …and which of those threads is still open. Resolution is not on the REST
# comment, only on the GraphQL thread that groups them.
gh api graphql -F owner={owner} -F repo={repo} -F pr=<pr-number> -f query='
  query($owner:String!,$repo:String!,$pr:Int!){ repository(owner:$owner,name:$repo){
    pullRequest(number:$pr){ reviewThreads(first:100){ nodes{
      isResolved path comments(first:1){ nodes{ author{login} body } } } } } } }' \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[]
        | select(.isResolved | not)
        | "UNRESOLVED\t\(.comments.nodes[0].author.login)\t\(.path)"'
```

- **Do not trust the platform's merge-state field for condition 1.** GitHub only reports `BEHIND` when the base branch *requires* branches to be up to date; with no branch protection a behind pull request still reports `CLEAN` or `UNSTABLE`. Compare commits instead.
- **A cancelled check is not a passed check.** A workflow with `cancel-in-progress: true` cancels the previous run on every new push — re-run it, don't waive it.
- **To bring a change up to date**, merge the main branch into it (or rebase it) and push. Then wait: checks that were green against the old base must run again against the new head.
- **Never use auto-merge.** It fires as soon as the platform's requirements are met, and with no branch protection there are none — it merges immediately, behind and red included. Inspect the checks and merge manually.
- **Re-read the threads after satisfying condition 1.** Rebasing or merging the main branch in moves the lines, the platform marks the threads outdated, and an outdated thread scrolls past as if it had been dealt with. Condition 7 is also where a bot comment matters most: a scanner whose findings arrive only as review comments is invisible to every check.

### Why condition 6 exists: green checks do not mean the diff is what you think

**Measured in one repository of this organization.** A pull request presented as a slice touching nineteen files was in fact proposing to **delete 4,895 lines across 115 files**: work that was already in the main branch, its **two database migrations**, its end-to-end specs, and a section of the repository's own agent instructions. Its commits had been made on top of a commit whose tree did not contain that work, so they carried it along as a deletion.

**All fifteen checks were green on that.** Deleting a whole feature *together with its tests* compiles, typechecks, lints, passes integration and passes every end-to-end shard. Nothing measures the size or the sign of a diff, so no gate could have caught it — and the reviewer who reads the description and the test count does not see it either, because the description was accurate about the nineteen files it meant.

Three things make this worth its own condition rather than a footnote:

- **Being behind does not detect it.** That change was twelve commits behind, and bringing the main branch in by rebasing *reproduces* the deletion, with conflicts that look like ordinary ones.
- **A revert of merged work is the one mistake the main branch does not undo cheaply.** Code can be restored from the branch, but a deleted migration that a later deploy re-runs against a database that already applied it is a different kind of afternoon.
- **The check costs one command**, which is why it is a condition and not advice.

**Repairing it does not mean re-doing the work.** Reset the branch to the main branch and bring back only its own files from the old tip, which is still on the remote (`git checkout <old-tip> -- <paths>`). For a file the main branch also touched, the wholesale checkout would revert it again — apply just your own hunk instead (`git diff <base> <old-tip> -- <file> | git apply -3 --index`). Then prove the rescue kept everything: `git diff <old-tip> HEAD -- <your paths>` must come back empty.

## Gate 2: You Have Run the Pre-Merge Plan Yourself

**You MUST NOT integrate a change until you have executed that change's pre-merge plan locally, yourself, against the change.**

**What counts as a pre-merge plan.** A short list of steps a human or an agent follows in the running application to confirm the change does what it claims. It normally appears under a heading in the change's description; a plan stated anywhere else — the issue, the task, the conversation — counts just the same. If the change genuinely has no pre-merge plan, this gate adds nothing and the next one governs — but **look before concluding that**, because writing one is part of proposing a change.

**What counts as having run it.** You executed the steps, on this change, and observed the outcomes. None of the following is a substitute, and none of them may be offered as one:

- CI being green. CI runs the checks; the plan exists precisely because the checks do not cover it.
- The code looking correct, or the diff being small, or the change being "only a seed / only a doc / only a config".
- Someone else's report that it works — the author's, a previous session's, or another agent's. A report is evidence about their run, not yours.
- A partial run. If any step could not be executed, the plan was not executed. Say which step and treat it as the blocked case below.
- Your own reasoning that the step would obviously pass.

**Executing it must be reliable, not merely attempted.** A step that you ran but whose outcome you could not actually observe — a screenshot you never looked at, a page you assumed rendered, a flow you drove blind — has not been executed. Prefer refusing to claim it over claiming it weakly.

**If the plan fails, the merge is off.** Fix the change and run the plan again from the top. Do not merge and follow up later, and do not reinterpret the failure as a flaw in the plan without saying so explicitly and getting agreement.

**If you cannot execute the plan autonomously and reliably, stop and ask for what you need.** Do not merge, do not waive the step, and do not quietly narrow the plan to the parts you happen to be able to run. Instead report, in one message:

1. which steps you can run and which you cannot;
2. for each one you cannot, **why** — the specific missing capability, credential, service, tool, environment variable, seeded data, device or permission;
3. **the concrete actions that would unblock you** — what the user should start, install, provision, reconnect, grant or reset so the step becomes runnable by you;
4. the alternative, if there is one: whether the user running those steps themselves and reporting back is acceptable for this change, and what exactly they should look at.

Then wait. The user may run the steps, unblock you, or waive the gate for that change — waiving it is the user's call and must be explicit; it is never yours to infer from silence, from urgency, or from the change looking safe.

**Why this rule exists.** Every automated gate is upstream of the running application: types, lint, unit tests, integration tests, and an end-to-end suite that only covers what someone already wrote a spec for. None of them can tell you that the screen a change was made for actually shows what it should. Merging on green is merging on the strength of the checks nobody wrote.

## Gate 3: You Have Exercised the Change by Hand

The gate above is conditional on a pre-merge plan existing, which leaves a hole: a change nobody wrote a plan for would need nothing at all. It needs this.

**Drive the change yourself in the running application before it goes into the main branch, unless it is evident that the change cannot introduce a regression.** Not the tests — the application: the screen, the flow, the command, the job. Everything in "What counts as having run it" above applies here too, so CI being green, the diff looking right, and somebody else's report are all still not substitutes.

**The exemption is about obviousness, not about size.** A one-character edit to a permission check is tiny and can regress everything behind it; a page of rewritten documentation is large and can regress nothing. The question is never "how big is this?" — it is "could something that works today stop working, or start behaving differently, because of this? and is the answer *evidently* no?" Note the asymmetry: you do not have to prove that a regression is possible in order to test. You have to be able to see that it is not, in order not to.

**Changes that evidently cannot regress anything.** A short, closed list — anything not on it can regress something until you have exercised it:

- documentation, comments, and commit or pull request text;
- `.gitignore`, editor configuration, and agent or tooling configuration that does not run inside the product;
- a test-only change with no production code touched — running the test *is* the exercise;
- a change whose entire observable effect is covered by a check that already exists and that you can name. Naming it is the price: "the tests cover it" in the abstract is not this.

**These read as regression-proof and are not.** Each has cost real time:

- **A rename, a move, or a refactor that "cannot change behaviour."** Moving where a fact is *read from* is invisible in the diff and often invisible in your own environment, because the thing that breaks is whoever still *writes* the old place — a parallel seed nobody remembered, a second code path, an external consumer. Running as one of the affected users shows it immediately; reading the diff does not.
- **A dependency bump.** The version number is the whole change and none of the behaviour.
- **A seed or fixture change.** It is the ground every other verification stands on, so a quiet error there makes everything downstream lie.
- **A copy or translation change.** The string is precisely what the user reads.

**When there is no screen**, exercise the closest thing to the real path — trigger the background job, invoke the server action through the UI that calls it, run a one-off script against the development environment — and state which you used and what you observed. "There is no UI for it" is not a reason to skip; it is a reason to say how you reached it.

**When no plan exists, write down the steps as you take them** and put them in the change. You had to decide what to check anyway; writing it down costs nothing extra and means the next person inherits a plan instead of re-deriving one.

**If you find yourself arguing that a regression is unlikely, you have already failed the test.** "Unlikely" is not "evidently impossible", and the argument is the tell: a regression you have to reason your way past is one you can see. Exercise it.

## Gate 4: You Have Run the Data Migration Against a Representative Dataset

The two gates above are about the application: they ask whether the screen still works. A migration can leave every screen working and still have destroyed data. It needs its own gate.

**You MUST NOT integrate a change that migrates already-stored data until you have run it yourself, under the conditions it will meet in production: starting from a dataset that represents the variety of possible initial states, applying the migration — or the whole sequence of them, in order — and then verifying that the resulting dataset is in the expected state.**

**What counts as a data migration.** Not only a file in the migrations directory. Any change whose effect is to transform, move, or reinterpret data that already exists:

- a backfill of a new column;
- renaming or moving a column, a table, or an index over existing rows;
- moving a fact from one store to another: column to column, object storage to database, database to object storage;
- reinterpreting a value that is already stored: an enum that gains or changes a meaning, a field that starts being derived instead of written;
- deleting or sweeping — rows in the database, objects in storage, including orphan-cleanup jobs;
- a seed change that alters rows that were already seeded.

Purely additive DDL that touches no existing row is out of scope: a new nullable column with no backfill, a new empty table, a new index. **If it ships with a backfill, it is not additive.**

**What counts as a representative starting dataset.** For every initial state the migration can meet, it must contain at least one row or object:

- **the old shape** — what the migration is supposed to transform;
- **the new shape, already migrated** — so you find out whether running it again breaks it. This is not theoretical: a migration gets retried whenever a deploy dies partway through it;
- **the absent** — the `null`, the empty collection, the row written before the column existed;
- **the broken** — the orphaned reference, the stored object no row points at, the row pointing at an object that is gone;
- **what must not be touched** — the other tenant's row, the record the `WHERE` clause is supposed to leave alone. The most common way a migration passes its test and breaks production is by transforming *more* than it was meant to.

**A freshly seeded database is not a representative dataset.** A reset produces precisely the state no migration ever meets in production: clean, coherent, with no history. It is where you *develop* the migration, not where you test it.

**Build the dataset explicitly** — a SQL script, a one-off seed, a fixture — and leave it in the repository or in the change so it can be run again by whoever inherits the migration. **Put it next to the migration**, in its own directory, when the migration tool's checksum covers only the migration file itself, so neighbouring files are inert. Verify that before relying on it. Proximity is the point: this gate is executed by whoever *integrates* the migration, not by whoever wrote it, and a fixture filed under `docs/` is only found by somebody who already knows it exists.

**Run the recipe you write.** The obvious one usually does not work: a path passed to a database client resolves *inside* the container, not on your machine, and a container name matched loosely will match a sibling worktree's stack.

**What counts as verifying the result.** Assertions about the data, not a look at the application. Count before, predict, then count after: how many rows were in each state, how many should be in each state once the migration has run, how many actually are. The screen looking right is the previous gate and does not stand in for this one — a migration that loses 3% of the rows leaves a flawless screen for the other 97%. Everything already ruled out by the gates above is still ruled out here: CI being green, the diff being small, "it's only a seed", somebody else's report, and your own reasoning that it would obviously pass.

**If the verification fails, the integration is off.** Fix the migration and run it again from the *original* starting dataset — never from the half-transformed one the failed attempt left behind, which is a state your next run would then be lying about.

**If you cannot build the dataset or run the migration autonomously and reliably, stop and ask for what you need**, with the same four points as Gate 2: what you can and cannot run, why, what would unblock you, and the alternative. Waiving this gate is the user's call and must be explicit.

**Why this rule exists.** Typically no gate in a project ever exercises a migration against pre-existing data. Unit tests do not touch the database; the end-to-end suite builds its database **from scratch** on every run, so it exercises the schema and never the transformation. A migration is also the one kind of change no later deploy undoes: code gets reverted, data does not.

## Gate 5: The Change Ships the Mechanism That Removes Its Leftover Data

**You MUST NOT integrate a change that can produce data nothing will ever need again — rows, stored objects, files — unless the change itself ships the mechanism that removes it.** The mechanism is part of the change, not a follow-up: a feature that writes and never deletes is not finished.

**What counts as data nothing will need again:**

- **an object whose owning row is gone, or was never written** — an upload that completed at the storage service and then failed to materialise its entity; a multipart session the browser abandoned, which is billed for the parts of an unfinished upload;
- **an object that was replaced** — the previous logo, the previous cover. Overwriting the *reference* does not touch the bytes;
- **a row for a flow that has terminated** — an upload job after the upload completed, a conversion job after it converted;
- **anything under a parent that was deleted** — delete the organization, the course, the lesson, and every row and object hanging off it is now unreferenced;
- **a projection, cache, or derived copy that outlives what it derived from**;
- **anything written by a code path behind a feature flag that was never switched on, or was switched off.**

**What counts as the mechanism.** It has to be named, it has to be in the change, and you have to have watched it delete something. Three shapes, and which one is correct is not a preference:

- **Inline deletion, in the same flow or transaction** — when there is a determinate moment at which the data becomes unreferenced. This is the default. Reaching for a sweep instead of a deletion you could have done inline is choosing to accumulate garbage and to pay a recurring query for it.
- **A cascade at the persistence layer** — when the parent's deletion is the trigger. Say so explicitly and point at the declaration; "the ORM probably handles it" is not naming a mechanism. Note that a cascade reaches rows and never reaches stored objects: deleting the row that held an object key deletes the pointer and leaves the bytes.
- **A sweep job** — when the orphan is produced by a failure or a race, so there is no single moment where it becomes garbage. A sweep is also the right **backstop** next to inline deletion, because inline deletion fails too; what it is not is a substitute for one.

**A sweep needs a grace period, and the period is a decision.** A sweep that runs against a just-created object races the flow that is about to reference it, and deletes the user's upload half a second before it is claimed. Pick the period from the longest the referencing flow can legitimately take, and say where the number came from.

**Scope the deletion to exactly what is unreferenced.** A prefix is not a scope. Deleting a whole storage path because one object under it is orphaned has already destroyed files that were not garbage. Enumerate what you are about to remove, check each item against what still references it, and remove those — not the container they happen to share.

**"Nothing will ever need this again" is a claim you make, not a default.** Deleting data that was still evidence is the more expensive mistake, and it is easy to make because the useless-looking row and the load-bearing one look identical. A failed-payment row is the only trace of "I paid and got nothing"; a replaced external account identifier is what reconciliation will ask for.

If the data is evidence of a failure, an audit trail, or the only record that something happened, it is **not** orphaned: it is retained. Then this gate still applies, inverted — say in the change that it is retained, why, and for how long. "We keep it forever because nobody decided" is the same unbounded growth wearing a better excuse.

**If you cannot ship the mechanism, stop and say so.** Report what accumulates, **at what rate**, what would remove it, and what leaving it costs — storage, a data-erasure request that will miss it, or a future migration that has to decide what to do with rows nobody can explain. Waiving this gate is the user's call and must be explicit. If it is waived, the debt is written down **with the rate**: "some orphans accumulate" is not something anyone can prioritise.

**Why this rule exists.** Nothing warns you. An orphan breaks no test, fails no check, and costs nothing the day it is created — it surfaces later as a bill, as an erasure request that cannot find data the domain no longer points at, or as a migration blocked on rows whose meaning is gone with the person who wrote them. Sweep jobs tend to be written **after** their orphans appeared, which is the pattern this gate exists to break. And object storage does not clean itself: unless a bucket carries a lifecycle rule, every byte that leaves is a byte someone explicitly deleted.

## Review Questions

Before integrating, ask:

- Does the head contain the tip of the main branch, and has every check concluded successfully?
- Do the diff's file count and deletions match what the change claims to do?
- Has every review comment been read and attended to, including the bots' and the ones the platform marked outdated?
- Did *you* run the pre-merge plan, or exercise the change by hand, and observe the outcomes?
- If data already stored is transformed: did you run the migration against a dataset containing the old shape, the already-migrated shape, the absent, the broken, and what must not be touched — and assert on the resulting counts?
- If the change can leave data behind: did you name the mechanism that removes it, and watch it delete something?

If the answer to any of them is no, the integration is off.

## Report the Outcome

When integrating a change, state:

- which conditions of Gate 1 you verified, and how;
- which pre-merge plan you ran, or how you exercised the change by hand, and what you observed;
- for a data migration: what the starting dataset contained, and the counts before and after;
- for leftover data: which mechanism removes it, and what you saw it delete;
- any gate that was waived, who waived it, and in which words.
