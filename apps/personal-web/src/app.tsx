import { useEffect, useMemo, useState } from "react";
import { calculateInsights, type BodyMeasurements, type StylePreferences, type TwinProfile } from "@fittwin/core";
import { TwinSilhouette, twinSilhouetteCss } from "@fittwin/react";
import { createFitTwin, type StyleAdvisor, type StyleGuide } from "@fittwin/sdk";
import { IndexedDbProfileStore } from "./store";

const PROFILE_ID = "personal-profile";
const defaults: BodyMeasurements = {
  height: { value: 170, unit: "cm" }, shoulder: { value: 42, unit: "cm" }, chest: { value: 90, unit: "cm" }, waist: { value: 74, unit: "cm" }, hip: { value: 96, unit: "cm" }, inseam: { value: 78, unit: "cm" }
};
const defaultPreferences: StylePreferences = { goals: ["minimal"], occasions: ["daily"], fitPreference: "regular", avoid: [] };
const labels = {
  zh: { title: "FitTwin", intro: "你的本地身材档案与穿衣指南", language: "EN", measurements: "身体测量", preferences: "风格偏好", create: "保存我的档案", saved: "档案已保存在此设备", twin: "中性数字孪生", insights: "比例观察", ai: "AI 穿衣指南", connect: "连接本地 AI", generate: "生成我的指南", consent: "我同意仅将本次所需的匿名化身材摘要和偏好发送到我自己的本地代理。", noGuide: "启动本地 companion 并填入配对令牌后，才会生成 AI 建议。", feedback: "这条建议对我有用", notUseful: "不适合我", export: "导出档案", erase: "删除本机数据", privacy: "默认不联网，不收集遥测，不保存 API Key。", height: "身高", shoulder: "肩宽", chest: "胸围", waist: "腰围", hip: "臀围", inseam: "内侧裤长", torso: "躯干长度（可选）", arm: "臂长（可选）", thigh: "大腿围（可选）", goals: "想呈现的风格", occasions: "常见场景", fit: "合身偏好", avoid: "想避开的元素（用逗号分隔）", endpoint: "本地代理地址", token: "配对令牌", guideError: "生成失败", ready: "已连接", advice: "建议" },
  en: { title: "FitTwin", intro: "Your private body profile and style guide", language: "中文", measurements: "Measurements", preferences: "Style preferences", create: "Save my profile", saved: "Profile saved on this device", twin: "Neutral digital twin", insights: "Proportion notes", ai: "AI style guide", connect: "Connect local AI", generate: "Generate my guide", consent: "I agree to send only this request's minimized body summary and preferences to my own local companion.", noGuide: "Start the local companion and enter its pairing token to generate an AI guide.", feedback: "This helps", notUseful: "Not for me", export: "Export profile", erase: "Delete local data", privacy: "No network by default, no telemetry, no stored API keys.", height: "Height", shoulder: "Shoulder width", chest: "Chest", waist: "Waist", hip: "Hip", inseam: "Inseam", torso: "Torso length (optional)", arm: "Arm length (optional)", thigh: "Thigh circumference (optional)", goals: "Style goals", occasions: "Typical occasions", fit: "Fit preference", avoid: "Avoid (comma separated)", endpoint: "Local companion URL", token: "Pairing token", guideError: "Could not generate guide", ready: "Connected", advice: "Advice" }
} as const;

class LocalCompanionAdvisor implements StyleAdvisor {
  constructor(private endpoint: string, private token: string) {}
  async generate(input: Parameters<StyleAdvisor["generate"]>[0]): Promise<StyleGuide> {
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/v1/style-guide`, { method: "POST", headers: { "content-type": "application/json", "x-fittwin-token": this.token }, body: JSON.stringify({ measurements: input.measurements, preferences: input.preferences, feedback: input.feedback }) });
    if (!response.ok) throw new Error(await response.text() || `Local companion returned ${response.status}`);
    return response.json() as Promise<StyleGuide>;
  }
}

export function App() {
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [measurements, setMeasurements] = useState<BodyMeasurements>(defaults);
  const [preferences, setPreferences] = useState<StylePreferences>(defaultPreferences);
  const [profile, setProfile] = useState<TwinProfile>();
  const [guide, setGuide] = useState<StyleGuide>();
  const [consent, setConsent] = useState(false);
  const [endpoint, setEndpoint] = useState("http://127.0.0.1:47831");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string>();
  const t = labels[language];
  const sdk = useMemo(() => createFitTwin({ store: new IndexedDbProfileStore() }), []);

  useEffect(() => { sdk.getProfile(PROFILE_ID).then((saved) => { if (saved) { setProfile(saved); setMeasurements(saved.measurements); setPreferences(saved.preferences); } }).catch(() => setStatus("Unable to read local storage.")); }, [sdk]);

  const save = async () => {
    try {
      const updated = profile ? await sdk.updateProfile(PROFILE_ID, { measurements, preferences }) : await sdk.createProfile({ id: PROFILE_ID, measurements, preferences });
      setProfile(updated); setStatus(t.saved);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save profile."); }
  };
  const generate = async () => {
    if (!consent) return setStatus(t.consent);
    try {
      const current = profile ? await sdk.updateProfile(PROFILE_ID, { measurements, preferences }) : await sdk.createProfile({ id: PROFILE_ID, measurements, preferences });
      setProfile(current);
      const aiSdk = createFitTwin({ store: new IndexedDbProfileStore(), advisor: new LocalCompanionAdvisor(endpoint, token) });
      setGuide(await aiSdk.generateStyleGuide(PROFILE_ID)); setStatus(t.ready);
    } catch (error) { setStatus(`${t.guideError}: ${error instanceof Error ? error.message : "Unknown error"}`); }
  };
  const feedback = async (sentiment: "like" | "dislike") => { if (!profile) return; const trait = guide?.silhouettes[0]?.recommendation ?? "style guide"; const updated = await sdk.updateProfile(PROFILE_ID, { feedback: [...profile.feedback, { trait, sentiment, createdAt: new Date().toISOString() }] }); setProfile(updated); setStatus(sentiment === "like" ? "Saved locally." : "Saved locally; the next guide will adapt."); };
  const download = async () => { if (!profile) return; const blob = new Blob([await sdk.exportProfile(profile.id)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "fittwin-profile.json"; a.click(); URL.revokeObjectURL(url); };
  const erase = async () => { await sdk.deleteProfile(PROFILE_ID); setProfile(undefined); setGuide(undefined); setStatus("Local profile deleted."); };
  const setMeasurement = (key: keyof BodyMeasurements, value: string) => setMeasurements((current) => ({ ...current, [key]: value ? { value: Number(value), unit: current[key]?.unit ?? "cm" } : undefined }));

  return <main><style>{twinSilhouetteCss}</style><header><div><strong>FitTwin</strong><span>{t.intro}</span></div><button className="text-button" onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{t.language}</button></header>
    <section className="hero"><p className="eyebrow">PRIVATE BY DEFAULT</p><h1>Fit that starts<br />with <em>you.</em></h1><p>{t.privacy}</p></section>
    <section className="workspace">
      <form className="profile-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <div className="section-heading"><h2>{t.measurements}</h2><span>cm / in</span></div>
        <div className="measure-grid">{(["height", "shoulder", "chest", "waist", "hip", "inseam", "torso", "arm", "thigh"] as Array<keyof BodyMeasurements>).map((key) => <label key={key}>{t[key]}<div className="measurement-input"><input required={!(["torso", "arm", "thigh"] as string[]).includes(key)} min="1" type="number" value={measurements[key]?.value ?? ""} onChange={(event) => setMeasurement(key, event.target.value)} /><select value={measurements[key]?.unit ?? "cm"} onChange={(event) => setMeasurements((current) => ({ ...current, [key]: { value: current[key]?.value ?? 0, unit: event.target.value as "cm" | "in" } }))}><option>cm</option><option>in</option></select></div></label>)}</div>
        <div className="section-heading space"><h2>{t.preferences}</h2></div>
        <fieldset><legend>{t.goals}</legend><div className="chip-row">{["minimal", "classic", "streetwear", "creative", "sport", "formal"].map((goal) => <button type="button" key={goal} className={preferences.goals.includes(goal as never) ? "chip active" : "chip"} onClick={() => setPreferences((p) => ({ ...p, goals: p.goals.includes(goal as never) && p.goals.length > 1 ? p.goals.filter((item) => item !== goal) as StylePreferences["goals"] : p.goals.includes(goal as never) ? p.goals : [...p.goals, goal as never] }))}>{goal}</button>)}</div></fieldset>
        <fieldset><legend>{t.occasions}</legend><div className="chip-row">{["daily", "work", "date", "travel", "event"].map((occasion) => <button type="button" key={occasion} className={preferences.occasions.includes(occasion as never) ? "chip active" : "chip"} onClick={() => setPreferences((p) => ({ ...p, occasions: p.occasions.includes(occasion as never) && p.occasions.length > 1 ? p.occasions.filter((item) => item !== occasion) as StylePreferences["occasions"] : p.occasions.includes(occasion as never) ? p.occasions : [...p.occasions, occasion as never] }))}>{occasion}</button>)}</div></fieldset>
        <label>{t.fit}<select className="wide" value={preferences.fitPreference} onChange={(event) => setPreferences((p) => ({ ...p, fitPreference: event.target.value as StylePreferences["fitPreference"] }))}><option value="slim">slim</option><option value="regular">regular</option><option value="relaxed">relaxed</option></select></label>
        <label>{t.avoid}<input value={preferences.avoid.join(", ")} onChange={(event) => setPreferences((p) => ({ ...p, avoid: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} /></label>
        <button className="primary" type="submit">{t.create}</button>
      </form>
      <aside className="twin-panel"><div className="section-heading"><h2>{t.twin}</h2><span>v1.0</span></div><TwinSilhouette measurements={measurements} /><div className="insights"><h3>{t.insights}</h3>{profile ? <ul>{profile && twinNotes(measurements, language).map((note) => <li key={note}>{note}</li>)}</ul> : <p>Save a profile to retain your personal notes.</p>}</div></aside>
    </section>
    <section className="ai-section"><div><p className="eyebrow">LOCAL COMPANION</p><h2>{t.ai}</h2><p>{t.noGuide}</p></div><div className="ai-control"><label>{t.endpoint}<input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} /></label><label>{t.token}<input value={token} onChange={(event) => setToken(event.target.value)} type="password" autoComplete="off" /></label><label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{t.consent}</label><button className="primary" onClick={() => void generate()} disabled={!token}>{t.generate}</button></div></section>
    {guide && <section className="guide"><div className="guide-intro"><p className="eyebrow">YOUR GUIDE</p><h2>{guide.summary}</h2><p>{guide.careNote}</p></div><div className="guide-content"><h3>{t.advice}</h3>{guide.silhouettes.map((item) => <article key={item.recommendation}><strong>{item.recommendation}</strong><p>{item.reason}</p></article>)}<h3>Outfit formulas</h3>{guide.outfitRecipes.map((item) => <article key={item.formula}><strong>{item.occasion}</strong><p>{item.formula} — {item.reason}</p></article>)}<div className="feedback"><button className="chip" onClick={() => void feedback("like")}>{t.feedback}</button><button className="chip" onClick={() => void feedback("dislike")}>{t.notUseful}</button></div></div></section>}
    <footer>{status && <p role="status">{status}</p>}<div><button className="text-button" onClick={() => void download()} disabled={!profile}>{t.export}</button><button className="text-button danger" onClick={() => void erase()} disabled={!profile}>{t.erase}</button></div></footer>
  </main>;
}

function twinNotes(measurements: BodyMeasurements, language: "zh" | "en") {
  const notes = calculateInsights(measurements).notes;
  if (language === "en") return notes;
  return [
    notes[0].startsWith("Your shoulder") ? "肩线和臀部比例整体较均衡。" : "下半身在视觉上比肩线更宽一些。",
    notes[1].startsWith("A defined") ? "如果符合你的风格，可以用腰线强调来增加层次。" : "直线条或柔和结构感的叠穿能形成干净的纵向线条。",
    notes[2].startsWith("Longer") ? "短款或扎进下装的上衣能突出腿部比例。" : "高腰线和连贯的裤装线条能拉长视觉比例。"
  ];
}
