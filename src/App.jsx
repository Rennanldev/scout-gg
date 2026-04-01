import { useState } from "react";

// ─── TEAMS ───────────────────────────────────────────────────────────────────
const VAL_TEAMS = ["LOUD", "FURIA", "NRG", "Sentinels", "Cloud9", "Team Liquid", "Fnatic", "NAVI", "EDG", "Paper Rex", "T1", "Gen.G"];
const LOL_TEAMS = ["T1", "Gen.G", "Cloud9", "Team Liquid", "100 Thieves", "G2 Esports", "Fnatic", "SKT", "LOUD", "FURIA", "RED Canids", "paiN Gaming"];

// ─── THEME ───────────────────────────────────────────────────────────────────
const THEME = {
  val: { primary: "#ff4655", secondary: "#00e5ff", accent: "#ff6b78" },
  lol: { primary: "#c89b3c", secondary: "#0bc4e3", accent: "#f0e6d3" },
};

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function StatBar({ label, valueA, valueB, colorA, colorB }) {
  const total = (valueA + valueB) || 1;
  const pctA = Math.round((valueA / total) * 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8890a4" }}>
        <span style={{ color: valueA >= valueB ? colorA : "#8890a4", fontWeight: valueA >= valueB ? 700 : 400 }}>{valueA}%</span>
        <span style={{ color: "#c8cdd8" }}>{label}</span>
        <span style={{ color: valueB > valueA ? colorB : "#8890a4", fontWeight: valueB > valueA ? 700 : 400 }}>{valueB}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#1a1f2e", display: "flex", overflow: "hidden" }}>
        <div style={{ width: `${pctA}%`, background: `linear-gradient(90deg, ${colorA}cc, ${colorA})`, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
        <div style={{ flex: 1, background: `linear-gradient(90deg, ${colorB}99, ${colorB})` }} />
      </div>
    </div>
  );
}

function FormDot({ result, colorW, colorL }) {
  const isW = result === "W";
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
      background: isW ? `${colorW}18` : `${colorL}10`,
      border: `1.5px solid ${isW ? colorW : colorL}`,
      color: isW ? colorW : colorL,
    }}>{result}</div>
  );
}

function InsightBox({ text, type, colorA, colorB }) {
  const map = { red: { bg: `${colorA}12`, border: colorA, icon: "🔴" }, blue: { bg: `${colorB}12`, border: colorB, icon: "🔵" }, neutral: { bg: "#ffc80012", border: "#ffc800", icon: "⚡" } };
  const c = map[type] || map.neutral;
  return (
    <div style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, borderRadius: 6, padding: "11px 14px", marginBottom: 8, fontSize: 12, lineHeight: 1.6, color: "#c8cdd8" }}>
      {c.icon} {text}
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#111827", border: "1px solid #1a1f2e", borderRadius: 12, padding: 20, marginTop: 16, ...style }}>{children}</div>;
}

function SectionTitle({ children, color }) {
  return <div style={{ fontSize: 11, letterSpacing: "0.2em", color, textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>{children}</div>;
}

function Spinner({ color }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ display: "inline-block", width: 44, height: 44, border: `3px solid #1a1f2e`, borderTop: `3px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ color: "#8890a4", marginTop: 18, fontSize: 12, letterSpacing: "0.12em" }}>BUSCANDO DADOS...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function WinProbBar({ probA, probB, teamA, teamB, colorA, colorB }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[{ team: teamA, prob: probA, color: colorA }, { team: teamB, prob: probB, color: colorB }].map(({ team, prob, color }) => (
          <div key={team} style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#8890a4", letterSpacing: "0.1em", marginBottom: 4 }}>{team}</div>
            <div style={{ fontSize: 38, fontWeight: 900, color, lineHeight: 1 }}>{prob}%</div>
          </div>
        ))}
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "#1a1f2e", display: "flex", overflow: "hidden" }}>
        <div style={{ width: `${probA}%`, background: `linear-gradient(90deg, ${colorA}cc, ${colorA})`, transition: "width 1.2s ease" }} />
        <div style={{ flex: 1, background: `linear-gradient(90deg, ${colorB}88, ${colorB})` }} />
      </div>
    </>
  );
}

// ─── VALORANT ANALYSIS ───────────────────────────────────────────────────────
function ValorantTab() {
  const [teamA, setTeamA] = useState("LOUD");
  const [teamB, setTeamB] = useState("FURIA");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ca = THEME.val.primary, cb = THEME.val.secondary;

  async function analyze() {
    if (teamA === teamB) { setError("Escolha times diferentes!"); return; }
    setError(null); setLoading(true); setData(null);
    try {
      const prompt = `Você é analista profissional de esports de Valorant. Analise: ${teamA} vs ${teamB}.

Retorne APENAS JSON válido, sem markdown:
{
  "winProb": {"a":<0-100>,"b":<0-100>},
  "overallWR": {"a":<número>,"b":<número>},
  "recentForm": {"a":["W ou L"x5],"b":["W ou L"x5]},
  "h2h": {"aWins":<n>,"bWins":<n>,"total":<n>},
  "pistolWR": {"a":<n>,"b":<n>},
  "pistolConversion": {"a":<n>,"b":<n>},
  "mapStats": [{"map":"Ascent","wrA":<n>,"wrB":<n>},{"map":"Bind","wrA":<n>,"wrB":<n>},{"map":"Haven","wrA":<n>,"wrB":<n>},{"map":"Split","wrA":<n>,"wrB":<n>},{"map":"Lotus","wrA":<n>,"wrB":<n>}],
  "sideControl": {"a":{"atk":<n>,"def":<n>},"b":{"atk":<n>,"def":<n>}},
  "insights": [{"text":"<insight específico>","type":"red|blue|neutral"},{"text":"<insight economia>","type":"red|blue|neutral"},{"text":"<insight mapa>","type":"red|blue|neutral"}],
  "verdict": "<veredito final 1 frase direto>"
}
Use dados realistas baseados no histórico competitivo real desses times.`;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const match = d.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error();
      setData(JSON.parse(match[0]));
    } catch { setError("Erro ao buscar análise. Tente novamente."); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <Card>
        <SectionTitle color={ca}>⚔ Selecionar Confronto</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 8, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: ca, letterSpacing: "0.1em", marginBottom: 5 }}>TIME A</div>
            <select style={selStyle(ca)} value={teamA} onChange={e => setTeamA(e.target.value)}>
              {VAL_TEAMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 900, color: ca }}>VS</div>
          <div>
            <div style={{ fontSize: 10, color: cb, letterSpacing: "0.1em", marginBottom: 5 }}>TIME B</div>
            <select style={selStyle(cb)} value={teamB} onChange={e => setTeamB(e.target.value)}>
              {VAL_TEAMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {error && <div style={{ color: ca, fontSize: 12, marginTop: 8, textAlign: "center" }}>{error}</div>}
        <button style={btnStyle(ca)} onClick={analyze} disabled={loading}>{loading ? "ANALISANDO..." : "🔍 GERAR ANÁLISE"}</button>
      </Card>

      {loading && <Card><Spinner color={ca} /></Card>}

      {data && !loading && <>
        <Card>
          <SectionTitle color={ca}>🎯 Probabilidade de Vitória</SectionTitle>
          <WinProbBar probA={data.winProb.a} probB={data.winProb.b} teamA={teamA} teamB={teamB} colorA={ca} colorB={cb} />
          <div style={{ marginTop: 14 }}>
            {data.insights?.map((ins, i) => <InsightBox key={i} text={ins.text} type={ins.type} colorA={ca} colorB={cb} />)}
          </div>
        </Card>

        <Card>
          <SectionTitle color={ca}>📊 Win Rate & Forma Recente</SectionTitle>
          <StatBar label="Win Rate Geral" valueA={data.overallWR.a} valueB={data.overallWR.b} colorA={ca} colorB={cb} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            {[{ team: teamA, form: data.recentForm.a, color: ca }, { team: teamB, form: data.recentForm.b, color: cb }].map(({ team, form, color }) => (
              <div key={team}>
                <div style={{ fontSize: 10, color, letterSpacing: "0.1em", marginBottom: 7 }}>{team} — ÚLTIMOS 5</div>
                <div style={{ display: "flex", gap: 5 }}>{(form || []).map((r, i) => <FormDot key={i} result={r} colorW={ca} colorL={cb} />)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle color={ca}>🤝 H2H</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: ca, marginBottom: 3 }}>{teamA}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: ca }}>{data.h2h.aWins}</div>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "#444", letterSpacing: "0.1em" }}>
              <div>VITÓRIAS</div>
              <div style={{ marginTop: 3, color: "#333" }}>{data.h2h.total} jogos</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: cb, marginBottom: 3 }}>{teamB}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: cb }}>{data.h2h.bWins}</div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle color={ca}>🔫 Pistol Rounds</SectionTitle>
          <StatBar label="Pistol Win Rate" valueA={data.pistolWR.a} valueB={data.pistolWR.b} colorA={ca} colorB={cb} />
          <StatBar label="Conversão Pós-Pistol" valueA={data.pistolConversion.a} valueB={data.pistolConversion.b} colorA={ca} colorB={cb} />
        </Card>

        <Card>
          <SectionTitle color={ca}>🗺️ Win Rate por Mapa</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 60px 1fr 50px", marginBottom: 8, fontSize: 10, color: "#555", letterSpacing: "0.06em" }}>
            <span style={{ color: ca, textAlign: "right" }}>{teamA}</span><span /><span style={{ textAlign: "center" }}>MAPA</span><span /><span style={{ color: cb }}>{teamB}</span>
          </div>
          {(data.mapStats || []).map(m => (
            <div key={m.map} style={{ display: "grid", gridTemplateColumns: "50px 1fr 60px 1fr 50px", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1f2e" }}>
              <span style={{ fontSize: 12, fontWeight: m.wrA > m.wrB ? 700 : 400, color: m.wrA > m.wrB ? ca : "#8890a4", textAlign: "right" }}>{m.wrA}%</span>
              <div style={{ height: 5, margin: "0 8px", borderRadius: 2, background: `${ca}30`, overflow: "hidden" }}>
                <div style={{ width: `${m.wrA}%`, height: "100%", background: ca }} />
              </div>
              <span style={{ textAlign: "center", fontSize: 11, color: "#c8cdd8", fontWeight: 600 }}>{m.map}</span>
              <div style={{ height: 5, margin: "0 8px", borderRadius: 2, background: `${cb}20`, overflow: "hidden" }}>
                <div style={{ width: `${m.wrB}%`, height: "100%", background: cb }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: m.wrB > m.wrA ? 700 : 400, color: m.wrB > m.wrA ? cb : "#8890a4" }}>{m.wrB}%</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle color={ca}>⚖️ Controle de Lado</SectionTitle>
          {[{ team: teamA, side: data.sideControl.a, color: ca }, { team: teamB, side: data.sideControl.b, color: cb }].map(({ team, side, color }) => (
            <div key={team} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color, letterSpacing: "0.1em", marginBottom: 7 }}>{team}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{ label: "ATK", val: side?.atk }, { label: "DEF", val: side?.def }].map(({ label, val }) => (
                  <div key={label} style={{ background: "#0d1117", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ background: "linear-gradient(135deg, #1a0a0c, #111827)", border: `1px solid ${ca}33`, textAlign: "center" }}>
          <SectionTitle color={ca}>🏆 Veredito Final</SectionTitle>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#e8ecf4", fontWeight: 600, margin: 0 }}>{data.verdict}</p>
        </Card>
      </>}
    </div>
  );
}

// ─── LOL ANALYSIS ────────────────────────────────────────────────────────────
function LolTab() {
  const [teamA, setTeamA] = useState("T1");
  const [teamB, setTeamB] = useState("Gen.G");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ca = THEME.lol.primary, cb = THEME.lol.secondary;

  async function analyze() {
    if (teamA === teamB) { setError("Escolha times diferentes!"); return; }
    setError(null); setLoading(true); setData(null);
    try {
      const prompt = `Você é analista profissional de League of Legends esports. Analise: ${teamA} vs ${teamB}.

Retorne APENAS JSON válido, sem markdown:
{
  "winProb": {"a":<0-100>,"b":<0-100>},
  "overallWR": {"a":<n>,"b":<n>},
  "recentForm": {"a":["W ou L"x5],"b":["W ou L"x5]},
  "h2h": {"aWins":<n>,"bWins":<n>,"total":<n>},
  "firstBlood": {"giveA":<n pct que dá first blood pro inimigo>,"giveB":<n>,"takeA":<n pct que tira first blood>,"takeB":<n>},
  "dragonControl": {"firstDrakeA":<n pct pega 1o drag>,"firstDrakeB":<n>,"drakeWinA":<n wr quando pega drag>,"drakeWinB":<n>},
  "baronControl": {"firstBaronA":<n>,"firstBaronB":<n>,"baronConvA":<n pct converte baron em vitoria>,"baronConvB":<n>},
  "earlyGame": {"goldDiff15A":<número ouro médio +/- aos 15min>,"goldDiff15B":<n>,"towerFirstA":<n pct pega 1a torre>,"towerFirstB":<n>},
  "sideControl": {"blueWRA":<n wr blue side>,"blueWRB":<n>,"redWRA":<n wr red side>,"redWRB":<n>},
  "draft": {"preferedStyleA":"<estilo ex: teamfight, poke, pick>","preferedStyleB":"<estilo>","banFocusA":"<foco de ban>","banFocusB":"<foco de ban>","comfortPicksA":["pick1","pick2","pick3"],"comfortPicksB":["pick1","pick2","pick3"]},
  "players": {
    "a": [{"name":"<nome>","role":"<Top|Jg|Mid|Adc|Sup>","kda":<n>,"kp":<n pct>,"dpm":<n>}x5],
    "b": [{"name":"<nome>","role":"<Top|Jg|Mid|Adc|Sup>","kda":<n>,"kp":<n pct>,"dpm":<n>}x5]
  },
  "insights": [{"text":"<insight específico>","type":"red|blue|neutral"},{"text":"<insight objetivos>","type":"red|blue|neutral"},{"text":"<insight draft/players>","type":"red|blue|neutral"}],
  "verdict": "<veredito final 1 frase direto>"
}
Use dados realistas baseados no histórico competitivo real desses times. Seja preciso nos nomes dos jogadores.`;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const match = d.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error();
      setData(JSON.parse(match[0]));
    } catch { setError("Erro ao buscar análise. Tente novamente."); }
    finally { setLoading(false); }
  }

  const roleIcon = { Top: "🛡️", Jg: "🌿", Mid: "⚡", Adc: "🏹", Sup: "💛" };

  return (
    <div>
      <Card>
        <SectionTitle color={ca}>⚔ Selecionar Confronto</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 8, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: ca, letterSpacing: "0.1em", marginBottom: 5 }}>TIME A</div>
            <select style={selStyle(ca)} value={teamA} onChange={e => setTeamA(e.target.value)}>
              {LOL_TEAMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 900, color: ca }}>VS</div>
          <div>
            <div style={{ fontSize: 10, color: cb, letterSpacing: "0.1em", marginBottom: 5 }}>TIME B</div>
            <select style={selStyle(cb)} value={teamB} onChange={e => setTeamB(e.target.value)}>
              {LOL_TEAMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {error && <div style={{ color: ca, fontSize: 12, marginTop: 8, textAlign: "center" }}>{error}</div>}
        <button style={btnStyle(ca)} onClick={analyze} disabled={loading}>{loading ? "ANALISANDO..." : "🔍 GERAR ANÁLISE"}</button>
      </Card>

      {loading && <Card><Spinner color={ca} /></Card>}

      {data && !loading && <>
        <Card>
          <SectionTitle color={ca}>🎯 Probabilidade de Vitória</SectionTitle>
          <WinProbBar probA={data.winProb.a} probB={data.winProb.b} teamA={teamA} teamB={teamB} colorA={ca} colorB={cb} />
          <div style={{ marginTop: 14 }}>
            {data.insights?.map((ins, i) => <InsightBox key={i} text={ins.text} type={ins.type} colorA={ca} colorB={cb} />)}
          </div>
        </Card>

        <Card>
          <SectionTitle color={ca}>📊 Win Rate & Forma Recente</SectionTitle>
          <StatBar label="Win Rate Geral" valueA={data.overallWR.a} valueB={data.overallWR.b} colorA={ca} colorB={cb} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            {[{ team: teamA, form: data.recentForm.a, color: ca }, { team: teamB, form: data.recentForm.b, color: cb }].map(({ team, form, color }) => (
              <div key={team}>
                <div style={{ fontSize: 10, color, letterSpacing: "0.1em", marginBottom: 7 }}>{team} — ÚLTIMOS 5</div>
                <div style={{ display: "flex", gap: 5 }}>{(form || []).map((r, i) => <FormDot key={i} result={r} colorW={ca} colorL={cb} />)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle color={ca}>🤝 H2H</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: ca, marginBottom: 3 }}>{teamA}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: ca }}>{data.h2h.aWins}</div>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "#444", letterSpacing: "0.1em" }}>
              <div>VITÓRIAS</div><div style={{ marginTop: 3, color: "#333" }}>{data.h2h.total} jogos</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: cb, marginBottom: 3 }}>{teamB}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: cb }}>{data.h2h.bWins}</div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle color={ca}>🩸 First Blood</SectionTitle>
          <StatBar label="Taxa de First Blood (consegue)" valueA={data.firstBlood.takeA} valueB={data.firstBlood.takeB} colorA={ca} colorB={cb} />
          <StatBar label="Taxa de First Blood (sofre)" valueA={data.firstBlood.giveA} valueB={data.firstBlood.giveB} colorA={ca} colorB={cb} />
        </Card>

        <Card>
          <SectionTitle color={ca}>🐉 Dragon Control</SectionTitle>
          <StatBar label="Primeiro Drake" valueA={data.dragonControl.firstDrakeA} valueB={data.dragonControl.firstDrakeB} colorA={ca} colorB={cb} />
          <StatBar label="Win Rate com Drake" valueA={data.dragonControl.drakeWinA} valueB={data.dragonControl.drakeWinB} colorA={ca} colorB={cb} />
        </Card>

        <Card>
          <SectionTitle color={ca}>👁️ Baron Control</SectionTitle>
          <StatBar label="Primeiro Baron" valueA={data.baronControl.firstBaronA} valueB={data.baronControl.firstBaronB} colorA={ca} colorB={cb} />
          <StatBar label="Conversão Baron → Vitória" valueA={data.baronControl.baronConvA} valueB={data.baronControl.baronConvB} colorA={ca} colorB={cb} />
        </Card>

        <Card>
          <SectionTitle color={ca}>⏱️ Early Game (15 min)</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[{ team: teamA, gold: data.earlyGame.goldDiff15A, color: ca }, { team: teamB, gold: data.earlyGame.goldDiff15B, color: cb }].map(({ team, gold, color }) => (
              <div key={team} style={{ background: "#0d1117", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", marginBottom: 4 }}>{team} — GOLD DIFF</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: gold >= 0 ? color : "#8890a4" }}>
                  {gold >= 0 ? "+" : ""}{gold}
                </div>
              </div>
            ))}
          </div>
          <StatBar label="First Tower" valueA={data.earlyGame.towerFirstA} valueB={data.earlyGame.towerFirstB} colorA={ca} colorB={cb} />
        </Card>

        <Card>
          <SectionTitle color={ca}>🔵🔴 Blue Side / Red Side</SectionTitle>
          <StatBar label="Win Rate Blue Side" valueA={data.sideControl.blueWRA} valueB={data.sideControl.blueWRB} colorA={ca} colorB={cb} />
          <StatBar label="Win Rate Red Side" valueA={data.sideControl.redWRA} valueB={data.sideControl.redWRB} colorA={ca} colorB={cb} />
        </Card>

        <Card>
          <SectionTitle color={ca}>🎭 Draft & Composição</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ team: teamA, draft: data.draft, side: "A", color: ca }, { team: teamB, draft: data.draft, side: "B", color: cb }].map(({ team, draft, side, color }) => (
              <div key={team} style={{ background: "#0d1117", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color, letterSpacing: "0.1em", marginBottom: 8 }}>{team}</div>
                <div style={{ fontSize: 11, color: "#8890a4", marginBottom: 4 }}>Estilo: <span style={{ color: "#c8cdd8" }}>{side === "A" ? draft?.preferedStyleA : draft?.preferedStyleB}</span></div>
                <div style={{ fontSize: 11, color: "#8890a4", marginBottom: 6 }}>Bans: <span style={{ color: "#c8cdd8" }}>{side === "A" ? draft?.banFocusA : draft?.banFocusB}</span></div>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 4, letterSpacing: "0.08em" }}>COMFORT PICKS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(side === "A" ? draft?.comfortPicksA : draft?.comfortPicksB)?.map(p => (
                    <span key={p} style={{ background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 4, padding: "2px 7px", fontSize: 10, color }}>{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle color={ca}>🎮 Player Stats</SectionTitle>
          {[{ team: teamA, players: data.players?.a, color: ca }, { team: teamB, players: data.players?.b, color: cb }].map(({ team, players, color }) => (
            <div key={team} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color, letterSpacing: "0.1em", marginBottom: 8 }}>{team}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {(players || []).map((p, i) => (
                  <div key={i} style={{ background: "#0d1117", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 14 }}>{roleIcon[p.role] || "⚔️"}</div>
                    <div style={{ fontSize: 9, color, marginTop: 3, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{p.role}</div>
                    <div style={{ marginTop: 5, borderTop: "1px solid #1a1f2e", paddingTop: 5 }}>
                      <div style={{ fontSize: 11, color: "#c8cdd8", fontWeight: 700 }}>{p.kda}</div>
                      <div style={{ fontSize: 8, color: "#555" }}>KDA</div>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 11, color: "#c8cdd8", fontWeight: 700 }}>{p.kp}%</div>
                      <div style={{ fontSize: 8, color: "#555" }}>KP</div>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 11, color: "#c8cdd8", fontWeight: 700 }}>{p.dpm}</div>
                      <div style={{ fontSize: 8, color: "#555" }}>DPM</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ background: "linear-gradient(135deg, #0d0e08, #111827)", border: `1px solid ${ca}33`, textAlign: "center" }}>
          <SectionTitle color={ca}>🏆 Veredito Final</SectionTitle>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#e8ecf4", fontWeight: 600, margin: 0 }}>{data.verdict}</p>
        </Card>
      </>}
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function selStyle(color) {
  return {
    width: "100%", background: "#0d1117", border: `1px solid ${color}33`,
    borderRadius: 8, color: "#e8ecf4", padding: "11px 12px",
    fontSize: 15, fontWeight: 700, letterSpacing: "0.04em",
    appearance: "none", cursor: "pointer", outline: "none"
  };
}
function btnStyle(color) {
  return {
    width: "100%", padding: "15px", marginTop: 16,
    background: `linear-gradient(135deg, ${color}, ${color}bb)`,
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 13, fontWeight: 800, letterSpacing: "0.18em",
    textTransform: "uppercase", cursor: "pointer"
  };
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("val");
  const isVal = tab === "val";
  const activeColor = isVal ? THEME.val.primary : THEME.lol.primary;

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "'Barlow Condensed', 'Rajdhani', sans-serif", color: "#e8ecf4", paddingBottom: 60 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #1a1f2e", padding: "20px 20px 0", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.35em", color: activeColor, marginBottom: 3, transition: "color 0.3s" }}>ESPORTS ANALYTICS</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.06em", color: "#fff", margin: "0 0 16px", textTransform: "uppercase" }}>
          SCOUT<span style={{ color: activeColor, transition: "color 0.3s" }}>.GG</span>
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, borderBottom: "1px solid #1a1f2e" }}>
          {[
            { key: "val", label: "VALORANT", color: THEME.val.primary },
            { key: "lol", label: "LEAGUE OF LEGENDS", color: THEME.lol.primary }
          ].map(({ key, label, color }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: "none", border: "none", padding: "10px 20px",
              fontSize: 12, fontWeight: 800, letterSpacing: "0.15em",
              color: tab === key ? color : "#555",
              borderBottom: `2px solid ${tab === key ? color : "transparent"}`,
              cursor: "pointer", transition: "all 0.2s", marginBottom: -1
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        {tab === "val" ? <ValorantTab /> : <LolTab />}
      </div>
    </div>
  );
}
