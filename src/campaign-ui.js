import { CHALLENGES, campaignStats, recommendedChallenge, nextChallenge } from './challenges.js';

export function homeMarkup(achievements,hasBuild) {
  const stats=campaignStats(achievements), next=recommendedChallenge(achievements);
  return `<div class="home-hero"><div class="home-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><div class="eyebrow">DŘEVO · FYZIKA · TVŮRČÍ SVOBODA</div><h2>Postav něco<br>neobyčejného.</h2><p>Každá destička má svou váhu. Každá stavba svůj příběh.</p></div>
  <div class="campaign-score"><div><strong>${stats.completed}<small>/${CHALLENGES.length}</small></strong><span>Splněné výzvy</span></div><div><strong>★ ${stats.stars}<small>/${stats.maxStars}</small></strong><span>Získané hvězdy</span></div></div>
  <button class="wide-btn hero-button" id="homePlay">${hasBuild?'Pokračovat ve stavbě':'Začít stavět'}</button>
  <button class="home-option" id="homeCampaign"><span class="home-option-icon">★</span><div><b>${next?'Kariéra stavitele':'Kariéra dokončena'}</b><small>${next?next.title+' · doporučená výzva':'Vylepši své rekordy ve výzvách'}</small></div><span>›</span></button>
  <button class="home-option" id="homeSandbox"><span class="home-option-icon">▱</span><div><b>Volná stavba</b><small>Bez cíle, bez časového limitu</small></div><span>›</span></button>
  <button class="home-option" id="homeLevels"><span class="home-option-icon">▦</span><div><b>Všechny výzvy</b><small>${CHALLENGES.length} různých úloh</small></div><span>›</span></button>`;
}

export function resultMarkup(challenge,stars,measure,previous) {
  const next=nextChallenge(challenge.id);
  return `<div class="result-card"><div class="result-medal">✓</div><div class="result-stars" aria-label="${stars} ze 3 hvězd">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><h2>Výborná práce!</h2><p>${challenge.title} · konstrukce obstála</p></div>
  <div class="campaign-score"><div><strong>${measure.count}<small>/${challenge.limit}</small></strong><span>Destičky</span></div><div><strong>${measure.height.toFixed(1)}<small> cm</small></strong><span>Výška</span></div></div>
  <p class="result-note">${stars>(previous||0)?'Nové nejlepší hodnocení!':'Můžeš zkusit méně destiček a získat více hvězd.'}</p>
  <button class="wide-btn hero-button" id="resultNext">${next?'Další výzva · '+next.title:'Zpět do kariéry'}</button><button class="wide-btn secondary" id="resultKeep">Pokračovat v této stavbě</button><button class="wide-btn secondary" id="resultLevels">Všechny výzvy</button>`;
}
