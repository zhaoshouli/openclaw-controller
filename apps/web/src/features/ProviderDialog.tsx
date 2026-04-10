import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProviderSummary, UpsertProviderInput, ModelValidationResult } from "@openclaw/shared";
import { Modal } from "../components/Modal";
import { RoundedSelect } from "../components/RoundedSelect";

const providerSchema = z.object({
  provider_id: z.string().min(2, "请输入服务标识"),
  api: z.enum(["openai-responses", "gemini", "aliyun-qwen", "custom"]),
  base_url: z.string().url("请输入正确的 Base URL"),
  api_key: z.string().min(3, "请输入 API Key"),
  models: z.array(
    z.object({
      id: z.string().min(1, "模型 ID 必填"),
      alias: z.string().min(1, "模型名称必填")
    })
  ).min(1, "至少保留一个模型")
});

export type ProviderDialogValues = z.infer<typeof providerSchema>;

const providerOptions = [
  { value: "openai-responses", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "aliyun-qwen", label: "阿里灵积" },
  { value: "custom", label: "自定义兼容模式" }
] as const;

export function ProviderDialog({
  open,
  provider,
  validationResult,
  loading,
  onClose,
  onSubmit,
  onValidate
}: {
  open: boolean;
  provider?: ProviderSummary | null;
  validationResult?: ModelValidationResult | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (providerId: string, input: UpsertProviderInput) => Promise<void>;
  onValidate: (providerId: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"save" | "validate">("save");
  const form = useForm<ProviderDialogValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      provider_id: provider?.provider_id ?? "",
      api: provider?.api ?? "openai-responses",
      base_url: provider?.base_url ?? "https://api.openai.com/v1",
      api_key: "",
      models:
        provider?.models.length
          ? provider.models
          : [
              {
                id: "gpt-5.4-mini",
                alias: "GPT-5.4 Mini"
              }
            ]
    }
  });

  const fields = useFieldArray({
    control: form.control,
    name: "models"
  });

  useEffect(() => {
    form.reset({
      provider_id: provider?.provider_id ?? "",
      api: provider?.api ?? "openai-responses",
      base_url: provider?.base_url ?? "https://api.openai.com/v1",
      api_key: "",
      models:
        provider?.models.length
          ? provider.models
          : [
              {
                id: "gpt-5.4-mini",
                alias: "GPT-5.4 Mini"
              }
            ]
    });
  }, [provider, form, open]);

  async function handleSubmit(values: ProviderDialogValues) {
    await onSubmit(values.provider_id, {
      api: values.api,
      auth: "api-key",
      api_key: values.api_key,
      base_url: values.base_url,
      models: values.models
    });

    if (mode === "validate") {
      await onValidate(values.provider_id);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      title="添加模型服务"
      description="配置 API 节点与模型信息，支持 OpenAI 兼容格式。"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMode("validate");
              void form.handleSubmit(handleSubmit)();
            }}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
          >
            连通性测试
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMode("save");
                void form.handleSubmit(handleSubmit)();
              }}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600 disabled:opacity-60"
            >
              保存配置
            </button>
          </div>
        </div>
      }
    >
      <form className="space-y-5">
        <Field label="服务标识">
          <input className="input" {...form.register("provider_id")} placeholder="custom_openai" />
          <ErrorText text={form.formState.errors.provider_id?.message} />
        </Field>

        <Field label="服务模板">
          <Controller
            control={form.control}
            name="api"
            render={({ field }) => (
              <RoundedSelect
                value={field.value}
                onChange={field.onChange}
                options={[...providerOptions]}
              />
            )}
          />
        </Field>

        <Field label="连接地址 (Base URL)">
          <input className="input" {...form.register("base_url")} placeholder="https://api.openai.com/v1" />
          <ErrorText text={form.formState.errors.base_url?.message} />
        </Field>

        <Field label="模型列表">
          <div className="space-y-3">
            {fields.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <input className="input" {...form.register(`models.${index}.id`)} placeholder="gpt-5.4-mini" />
                <input className="input" {...form.register(`models.${index}.alias`)} placeholder="GPT-5.4 Mini" />
                <button
                  type="button"
                  className="rounded-full border border-line px-4 text-sm font-semibold text-slate-500 hover:text-red-500"
                  onClick={() => fields.remove(index)}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fields.append({ id: "", alias: "" })}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
            >
              添加模型
            </button>
          </div>
          <ErrorText text={form.formState.errors.models?.message as string | undefined} />
        </Field>

        <Field label="API Key">
          <input className="input" type="password" {...form.register("api_key")} placeholder="sk-..." />
          <ErrorText text={form.formState.errors.api_key?.message} />
        </Field>

        {validationResult ? (
          <div
            className={
              validationResult.status === "passed"
                ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            }
          >
            {validationResult.message}
            {validationResult.latency_ms ? ` · ${validationResult.latency_ms}ms` : ""}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ErrorText({ text }: { text?: string }) {
  return text ? <div className="text-xs text-red-500">{text}</div> : null;
}
