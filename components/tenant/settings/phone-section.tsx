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
import { publicOrderingApi } from "@/lib/public-ordering";
import { toast } from "sonner";
import { IconMicrophone, IconVolume } from "@tabler/icons-react";

type VoiceOption = {
  name: string;
  displayName: string;
  locale: string;
  gender?: string;
};

export function PhoneSection() {
  const [enabled, setEnabled] = useState(true);
  const [phone, setPhone] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [speechVoiceName, setSpeechVoiceName] = useState("en-NG-EzinneNeural");
  const [speechLanguage, setSpeechLanguage] = useState("en-NG");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api<{ data?: { enabled?: boolean; phone?: string; greeting?: string; instructions?: string; speechVoiceName?: string; speechLanguage?: string } }>("/v1/tenants/current/phone")
      .then((res) => {
        setEnabled(res.data?.enabled !== false);
        if (res.data?.phone) setPhone(res.data.phone);
        if (res.data?.greeting) setWelcomeMessage(res.data.greeting);
        if (res.data?.instructions) setInstructions(res.data.instructions);
        if (res.data?.speechVoiceName) setSpeechVoiceName(res.data.speechVoiceName);
        if (res.data?.speechLanguage) setSpeechLanguage(res.data.speechLanguage);
      })
      .catch(() => {});
    api<{ data?: { voices?: VoiceOption[] } }>("/v1/voice/voices")
      .then((res) => setVoices(res.data?.voices ?? []))
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
          speechVoiceName,
          speechVoiceStyle: "friendly",
          speechLanguage,
        }),
      });
      toast.success("AI voice settings updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save voice settings");
    } finally {
      setSaving(false);
    }
  }

  async function testVoice() {
    setTesting(true);
    try {
      const [{ data }, SpeechSDK] = await Promise.all([
        publicOrderingApi.webSpeechToken(),
        import("microsoft-cognitiveservices-speech-sdk"),
      ]);
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(data.token, data.region);
      speechConfig.speechSynthesisVoiceName = speechVoiceName;
      speechConfig.speechRecognitionLanguage = speechLanguage;
      const synthesizer = new SpeechSDK.SpeechSynthesizer(
        speechConfig,
        SpeechSDK.AudioConfig.fromDefaultSpeakerOutput(),
      );
      await new Promise<void>((resolve, reject) => {
        synthesizer.speakTextAsync(
          welcomeMessage.trim() || "Welcome. What would you like to order today?",
          () => {
            synthesizer.close();
            resolve();
          },
          (error) => {
            synthesizer.close();
            reject(new Error(String(error || "Could not preview voice")));
          },
        );
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not preview voice");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
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
              Customers can speak their order and hear the assistant respond.
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

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label>Assistant voice</Label>
            <NativeSelect
              className="w-full"
              value={speechVoiceName}
              onChange={(event) => {
                const voice = voices.find((item) => item.name === event.target.value);
                setSpeechVoiceName(event.target.value);
                if (voice?.locale) setSpeechLanguage(voice.locale);
              }}
            >
              {voices.map((voice) => (
                <NativeSelectOption key={voice.name} value={voice.name}>
                  {voice.displayName} · {voice.locale}
                </NativeSelectOption>
              ))}
              {voices.length === 0 ? (
                <NativeSelectOption value={speechVoiceName}>{speechVoiceName}</NativeSelectOption>
              ) : null}
            </NativeSelect>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={testVoice} disabled={testing}>
              <IconVolume className="size-4" />
              {testing ? "Playing..." : "Preview"}
            </Button>
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
