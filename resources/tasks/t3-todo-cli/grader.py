#!/usr/bin/env python3
"""Deterministic grader for the t3-todo-cli task.

Usage: python3 grader.py <grading-dir>
The grading dir is a throwaway copy of the civ's workdir (see tournament.mjs),
so writes (tasks.json, __pycache__) are harmless. Prints a final JSON line:
{"pass_rate": 0..1, "passed": n, "total": n, "checks": [...]}

Plain stdlib only (runs under any python3; also pytest-compatible style).
"""

import json
import os
import sys


def main():
    grading_dir = sys.argv[1]
    os.chdir(grading_dir)  # persistence writes land in the copy
    sys.path.insert(0, grading_dir)

    checks = []

    def check(name, fn):
        try:
            fn()
            checks.append({"name": name, "ok": True})
        except Exception as e:  # noqa: BLE001
            checks.append({"name": name, "ok": False, "error": str(e)[:160]})

    todo = {}

    def _import():
        import importlib
        mod = importlib.import_module("todo")
        todo.update({k: getattr(mod, k) for k in ("add_task", "list_tasks", "done_task", "delete_task")})

    check("import todo.py with the 4 required functions", _import)

    def _add_returns_int_id():
        tid = todo["add_task"]("买牛奶")
        assert isinstance(tid, int), f"id must be int, got {type(tid)}"
        todo["_tid"] = tid

    check("add_task returns an integer id", _add_returns_int_id)

    def _list_contains_task():
        tasks = todo["list_tasks"]()
        assert isinstance(tasks, list), "list_tasks must return a list"
        hit = [t for t in tasks if t.get("id") == todo.get("_tid") and t.get("title") == "买牛奶"]
        assert hit, "added task not found in list_tasks()"
        assert "done" in hit[0], "task dict must carry a done flag"

    check("list_tasks returns the added task with id/title/done", _list_contains_task)

    def _done_marks_complete():
        assert todo["done_task"](todo["_tid"]) in (True, 1), "done_task should succeed"
        tasks = [t for t in todo["list_tasks"]() if t.get("id") == todo["_tid"]]
        assert tasks and tasks[0].get("done") in (True, 1), "task not marked done"

    check("done_task marks the task complete", _done_marks_complete)

    def _delete_removes():
        assert todo["delete_task"](todo["_tid"]) in (True, 1), "delete_task should succeed"
        assert not [t for t in todo["list_tasks"]() if t.get("id") == todo["_tid"]], "task still listed"

    check("delete_task removes the task", _delete_removes)

    def _invalid_ids_safe():
        assert todo["done_task"](-999) in (False, 0, None), "done_task(bad id) must be falsy, not raise"
        assert todo["delete_task"](-999) in (False, 0, None), "delete_task(bad id) must be falsy, not raise"

    check("invalid ids handled without exceptions", _invalid_ids_safe)

    def _persisted():
        todo["add_task"]("写报告")
        assert os.path.exists("tasks.json"), "tasks.json not created in cwd"
        data = json.load(open("tasks.json", encoding="utf8"))
        assert isinstance(data, list) and any(t.get("title") == "写报告" for t in data), "tasks.json missing the task"

    check("writes persist to tasks.json (valid JSON list)", _persisted)

    passed = sum(1 for c in checks if c["ok"])
    total = len(checks)
    print(json.dumps({
        "pass_rate": round(passed / total, 4),
        "passed": passed,
        "total": total,
        "checks": checks,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
