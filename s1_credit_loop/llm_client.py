#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
llm_client.py - 可选大模型客户端（OpenAI 兼容 /chat/completions 协议）

零第三方依赖，仅标准库实现，目录自足。案例默认使用本地规则推演；
配置密钥后，"思考环节"可切换为真实大模型研判，两种模式输出结构一致、可对比。

配置方式（优先级从高到低）：
1. 环境变量 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
2. 本文件同级目录或当前工作目录下的 .env 文件（KEY=VALUE 每行一条）

默认接入 DeepSeek（api.deepseek.com，OpenAI 兼容协议）；
OpenAI 及各类兼容服务（通义、月之暗面、私有网关等）改 LLM_BASE_URL/LLM_MODEL 即可。

安全约定：
- 密钥只从环境变量或本机 .env 读取，不写入代码、不打印、不进入日志与任何回传；
- 网络失败、超时或返回结构异常时一律返回 None，由调用方回退本地规则版，
  闭环不因单点失败而中断。
"""

import json
import os
import sys
import urllib.request
from typing import Any, Dict, List, Optional

_TIMEOUT = 30
_ENV_FILE = ".env"
_last_error = ""  # 最近一次调用失败原因（不含密钥等敏感信息），供回退时提示


def last_error() -> str:
    """返回最近一次调用失败的原因描述；无失败时为空串。"""
    return _last_error


def _load_env_file() -> None:
    """加载本机 .env（不覆盖已存在的环境变量）。"""
    for directory in (os.path.dirname(os.path.abspath(__file__)), os.getcwd()):
        path = os.path.join(directory, _ENV_FILE)
        if not os.path.isfile(path):
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        except OSError:
            pass
        break


def config() -> Optional[Dict[str, str]]:
    """读取配置；未配置密钥时返回 None。"""
    _load_env_file()
    key = os.environ.get("LLM_API_KEY", "").strip()
    if not key:
        return None
    return {
        "key": key,
        "base": os.environ.get("LLM_BASE_URL", "https://api.deepseek.com/v1").rstrip("/"),
        "model": os.environ.get("LLM_MODEL", "deepseek-chat"),
    }


def chat(messages: List[Dict[str, str]], temperature: float = 0.2) -> Optional[str]:
    """调用 chat/completions，成功返回 content 文本，任何失败返回 None。"""
    global _last_error
    _last_error = ""
    cfg = config()
    if cfg is None:
        return None
    body = json.dumps({
        "model": cfg["model"],
        "messages": messages,
        "temperature": temperature,
    }).encode("utf-8")
    request = urllib.request.Request(
        cfg["base"] + "/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + cfg["key"],
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return payload["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as exc:
        _last_error = "HTTP {}".format(exc.code)
    except Exception as exc:  # noqa: BLE001 网络/协议/解析异常统一回退
        _last_error = exc.__class__.__name__
    return None


def chat_json(messages: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """要求模型输出 JSON 并解析为字典；失败重试一次（附修复提示），再失败返回 None。"""
    base_prompt = {"role": "user", "content": "只输出 JSON 对象，不要输出任何其他文字。"}
    repair_prompt = {"role": "user", "content": "上一次输出不是合法 JSON，请重新输出，只输出 JSON 对象。"}
    for attempt in (1, 2):
        trial = chat(messages + ([base_prompt] if attempt == 1 else [repair_prompt]))
        if trial is None:
            return None
        try:
            result = json.loads(trial)
            if isinstance(result, dict):
                return result
        except ValueError:
            continue
    return None


def describe_mode() -> str:
    """当前思考环节模式说明（用于启动横幅，不含任何密钥信息）。"""
    cfg = config()
    if cfg is None:
        return "本地规则推演（未配置密钥，思考环节由内置规则完成）"
    return "真实大模型 {} @ {}".format(cfg["model"], cfg["base"].split("//")[-1].split("/")[0])


def ensure_config() -> None:
    """启动时的密钥交互：仅交互式终端且未配置时询问一次；其余场景静默回退本地规则版。

    用户粘贴的密钥仅写入本机 .env（权限 600，已被 .gitignore 忽略）；
    直接回车则本次及以后均使用本地规则推演。
    """
    if config() is not None or not sys.stdin.isatty():
        return
    print("未检测到 LLM_API_KEY：思考环节默认使用本地规则推演。")
    print("可选：粘贴 API Key（DeepSeek/OpenAI 兼容服务均可）启用真实大模型，回车跳过。")
    try:
        import getpass
        key = getpass.getpass("请输入 API Key（输入不回显，仅保存到本机 .env）：").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n已跳过，使用本地规则推演。")
        return
    if not key:
        print("已跳过，使用本地规则推演。")
        return
    directory = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(directory, _ENV_FILE)
    try:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write("LLM_API_KEY={}\n".format(key))
        os.chmod(path, 0o600)
    except OSError:
        print("写入 .env 失败，请改用环境变量方式配置。")
        return
    print("已保存到 {}（权限 600，不会进入版本库）。".format(path))
    print("如需改配服务地址或模型，在该文件补充 LLM_BASE_URL / LLM_MODEL 即可；")
    print("如需切回本地规则推演，删除该文件或移除 LLM_API_KEY 即可。")
