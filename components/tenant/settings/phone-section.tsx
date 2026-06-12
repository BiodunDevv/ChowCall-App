"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconMicrophone } from "@tabler/icons-react";

type VoiceOption = {
  name: string;
  displayName: string;
  locale: string;
  gender?: string;
};

type VoiceGroup = {
  language: string;
  label: string;
  voices: Array<{ id: string; label: string; genderSound?: string }>;
};

type VoiceModel = {
  id: string;
  label: string;
};

export function PhoneSection() {
  const [enabled, setEnabled] = useState(true);
  const [phone, setPhone] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [modelId, setModelId] = useState("amazon.nova-sonic-v1:0");
  const [voiceId, setVoiceId] = useState("tiffany");
  const [language, setLanguage] = useState("en-US");
  const [speakingStyle, setSpeakingStyle] = useState("friendly");
  const [responseSpeed, setResponseSpeed] = useState("normal");
  const [allowInterruptions, setAllowInterruptions] = useState(true);
  const [captionsEnabledByDefault, setCaptionsEnabledByDefault] = useState(true);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceOptions, setVoiceOptions] = useState<VoiceGroup[]>([]);
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { enabled?: boolean; phone?: string; greeting?: string; instructions?: string; voiceSettings?: {
      modelId?: string;
      language?: string;
      voiceId?: string;
      speakingStyle?: string;
      responseSpeed?: string;
      allowInterruptions?: boolean;
      captionsEnabledByDefault?: boolean;
    }; models?: VoiceModel[]; voiceOptions?: VoiceGroup[] } }>("/v1/tenants/current/phone")
      .then((res) => {
        setEnabled(res.data?.enabled !== false);
        if (res.data?.phone) setPhone(res.data.phone);
        if (res.data?.greeting) setWelcomeMessage(res.data.greeting);
        if (res.data?.instructions) setInstructions(res.data.instructions);
        if (res.data?.voiceSettings?.modelId) setModelId(res.data.voiceSettings.modelId);
        if (res.data?.voiceSettings?.language) setLanguage(res.data.voiceSettings.language);
        if (res.data?.voiceSettings?.voiceId) setVoiceId(res.data.voiceSettings.voiceId);
        if (res.data?.voiceSettings?.speakingStyle) setSpeakingStyle(res.data.voiceSettings.speakingStyle);
        if (res.data?.voiceSettings?.responseSpeed) setResponseSpeed(res.data.voiceSettings.responseSpeed);
        if (res.data?.voiceSettings?.allowInterruptions !== undefined) setAllowInterruptions(res.data.voiceSettings.allowInterruptions);
        if (res.data?.voiceSettings?.captionsEnabledByDefault !== undefined) setCaptionsEnabledByDefault(res.data.voiceSettings.captionsEnabledByDefault);
        if (res.data?.models) setModels(res.data.models);
        if (res.data?.voiceOptions) setVoiceOptions(res.data.voiceOptions);
      })
      .catch(() => {});
    api<{ data?: { voices?: VoiceOption[]; models?: VoiceModel[]; voiceOptions?: VoiceGroup[] } }>("/v1/voice/voices")
      .then((res) => {
        setVoices(res.data?.voices ?? []);
        setModels((current) => (current.length ? current : (res.data?.models ?? [])));
        setVoiceOptions((current) => (current.length ? current : (res.data?.voiceOptions ?? [])));
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/v1/tenants/current/phone", {
        method: "PATCH",
        body: JSON.stringify({
          enabled,
          phone,
          welcomeMessage,
          instructions,
          provider: "aws_nova_sonic",
          modelId,
          language,
          voiceId,
          speakingStyle,
          responseSpeed,
          allowInterruptions,
          captionsEnabledByDefault,
        }),
      });
      toast.success("AI voice settings updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save voice settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMicrophone className="size-4" />
          AI Voice Ordering
        </CardTitle>
        <CardDescription>
          Configure the web voice assistant customers hear on the public ordering page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable voice ordering</p>
          <p className="text-xs text-muted-foreground">
            Customers can speak their order and hear the Nova Sonic assistant respond.
          </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-1.5">
          <Label>Restaurant phone number</Label>
          <Input
            type="tel"
            placeholder="e.g. 08012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Shown as your direct contact number for customers who prefer to call your staff.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Welcome message</Label>
          <Input
            placeholder="Welcome to {restaurant name}. What would you like to order today?"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This is spoken when a customer starts a voice order.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Voice assistant instructions</Label>
          <Textarea
            rows={4}
            placeholder="Example: greet customers warmly, suggest zobo with rice meals, confirm spice level, and ask a follow-up question when an order is unclear."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Used by the assistant when it understands orders, suggests add-ons, or asks follow-up questions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Voice provider</Label>
            <NativeSelect className="w-full" value="aws_nova_sonic" disabled>
              <NativeSelectOption value="aws_nova_sonic">AWS Nova Sonic</NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label>Model</Label>
            <NativeSelect className="w-full" value={modelId} onChange={(event) => setModelId(event.target.value)}>
              {models.map((model) => (
                <NativeSelectOption key={model.id} value={model.id}>
                  {model.label}
                </NativeSelectOption>
              ))}
              {models.length === 0 ? <NativeSelectOption value={modelId}>Amazon Nova Sonic v1</NativeSelectOption> : null}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label>Language</Label>
            <NativeSelect
              className="w-full"
              value={language}
              onChange={(event) => {
                const nextLanguage = event.target.value;
                setLanguage(nextLanguage);
                const firstVoice = voiceOptions.find((group) => group.language === nextLanguage)?.voices[0];
                if (firstVoice) setVoiceId(firstVoice.id);
              }}
            >
              {voiceOptions.map((group) => (
                <NativeSelectOption key={group.language} value={group.language}>
                  {group.label}
                </NativeSelectOption>
              ))}
              {voiceOptions.length === 0 ? <NativeSelectOption value={language}>{language}</NativeSelectOption> : null}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label>Assistant voice</Label>
            <NativeSelect
              className="w-full"
              value={voiceId}
              onChange={(event) => {
                const voice = voices.find((item) => item.name === event.target.value);
                setVoiceId(event.target.value);
                if (voice?.locale) setLanguage(voice.locale);
              }}
            >
              {voices.filter((voice) => voice.locale === language).map((voice) => (
                <NativeSelectOption key={voice.name} value={voice.name}>
                  {voice.displayName} · {voice.locale}
                </NativeSelectOption>
              ))}
              {voices.length === 0 ? (
                <NativeSelectOption value={voiceId}>{voiceId}</NativeSelectOption>
              ) : null}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label>Speaking style</Label>
            <NativeSelect className="w-full" value={speakingStyle} onChange={(event) => setSpeakingStyle(event.target.value)}>
              <NativeSelectOption value="friendly">Friendly</NativeSelectOption>
              <NativeSelectOption value="professional">Professional</NativeSelectOption>
              <NativeSelectOption value="warm">Warm</NativeSelectOption>
              <NativeSelectOption value="calm">Calm</NativeSelectOption>
              <NativeSelectOption value="fast">Fast</NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label>Response speed</Label>
            <NativeSelect className="w-full" value={responseSpeed} onChange={(event) => setResponseSpeed(event.target.value)}>
              <NativeSelectOption value="normal">Normal</NativeSelectOption>
              <NativeSelectOption value="fast">Fast</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Nova Sonic currently supports selected languages and voices. For Nigerian restaurants, we recommend clear English with Nigerian-friendly assistant instructions.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
            <div>
              <p className="text-sm font-medium">Allow interruptions</p>
              <p className="text-xs text-muted-foreground">Customers can speak while the assistant is replying.</p>
            </div>
            <Switch checked={allowInterruptions} onCheckedChange={setAllowInterruptions} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
            <div>
              <p className="text-sm font-medium">Show captions</p>
              <p className="text-xs text-muted-foreground">Transcripts appear during voice orders by default.</p>
            </div>
            <Switch checked={captionsEnabledByDefault} onCheckedChange={setCaptionsEnabledByDefault} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save voice settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
