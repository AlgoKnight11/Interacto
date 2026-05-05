class ContentAnalyzer {
  constructor() {
    this.currentMode = 'screen';
    this.isProcessing = false;
    this.chartInstance = null;
    
    this.initializeElements();
    this.bindEvents();
    this.checkAIAvailability();
  }

  initializeElements() {
    // Buttons
    this.screenModeBtn = document.getElementById('screenModeBtn');
    this.manualModeBtn = document.getElementById('manualModeBtn');
    this.btnSemantic = document.getElementById('btnSemantic');
    this.btnSentiment = document.getElementById('btnSentiment');
    this.sendBtn = document.getElementById('sendBtn');
    this.clearBtn = document.getElementById('clearBtn');
    
    // Inputs
    this.promptInput = document.getElementById('promptInput');
    this.manualInputBox = document.getElementById('manualInputBox');
    this.analyzePageBtn = document.getElementById('analyzePageBtn');
    
    // States
    this.defaultState = document.getElementById('defaultState');
    this.resultsState = document.getElementById('resultsState');
    this.loadingState = document.getElementById('loadingState');
    
    // Output
    this.textResults = document.getElementById('textResults');
    this.mainChartCanvas = document.getElementById('mainChart');
    this.chartOverlay = document.getElementById('chartOverlay');
  }

  bindEvents() {
    this.screenModeBtn.addEventListener('click', () => this.switchMode('screen'));
    this.manualModeBtn.addEventListener('click', () => this.switchMode('manual'));
    
    this.btnSemantic.addEventListener('click', () => this.handleAction('semantic'));
    this.btnSentiment.addEventListener('click', () => this.handleAction('sentiment'));
    this.sendBtn.addEventListener('click', () => this.handleAction('general'));
    this.analyzePageBtn.addEventListener('click', () => this.handleAction('general'));
    
    this.clearBtn.addEventListener('click', () => this.resetState());
    
    this.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleAction('general');
      }
    });
  }

  resetState() {
    this.defaultState.style.display = 'flex';
    this.resultsState.style.display = 'none';
    this.loadingState.style.display = 'none';
    this.promptInput.value = '';
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.screenModeBtn.classList.remove('active');
    this.manualModeBtn.classList.remove('active');
    
    if (mode === 'screen') {
      this.screenModeBtn.classList.add('active');
      this.analyzePageBtn.style.display = 'flex';
      this.manualInputBox.style.display = 'none';
    } else {
      this.manualModeBtn.classList.add('active');
      this.analyzePageBtn.style.display = 'none';
      this.manualInputBox.style.display = 'block';
    }
  }

  async checkAIAvailability() {
    try {
      const lm = window.ai?.languageModel || window.LanguageModel;
      if (!lm || !lm.availability) {
        console.warn('Chrome AI APIs not available.');
        return false;
      }
      const availability = await lm.availability();
      return availability === 'available' || availability === 'downloadable';
    } catch (e) {
      console.error('Error checking AI availability', e);
      return false;
    }
  }

  async captureScreenData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [{ result: pageText }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.slice(0, 6000)
          };
        }
      });
      return pageText;
    } catch (error) {
      console.error('Error capturing screen data:', error);
      return { title: 'Unknown', url: 'Unknown', text: '' };
    }
  }

  async handleAction(actionType) {
    if (this.isProcessing) return;
    
    let inputData = '';
    if (this.currentMode === 'screen') {
      const pageData = await this.captureScreenData();
      inputData = `Title: ${pageData.title}\nURL: ${pageData.url}\nContent: ${pageData.text}`;
      // Append any user prompt if they typed something
      if (this.promptInput.value.trim()) {
        inputData += `\nUser Prompt: ${this.promptInput.value.trim()}`;
      }
    } else {
      inputData = this.promptInput.value.trim();
      if (!inputData) {
        alert("Please enter some text to analyze.");
        return;
      }
    }

    this.isProcessing = true;
    this.showLoading();

    try {
      const result = await this.processWithAI(inputData, actionType);
      this.renderResults(result, actionType);
    } catch (error) {
      console.error(error);
      this.textResults.innerHTML = `<div class="error">An error occurred: ${error.message}</div>`;
      this.showResults();
    } finally {
      this.isProcessing = false;
    }
  }

  showLoading() {
    this.defaultState.style.display = 'none';
    this.resultsState.style.display = 'none';
    this.loadingState.style.display = 'flex';
  }

  showResults() {
    this.loadingState.style.display = 'none';
    this.defaultState.style.display = 'none';
    this.resultsState.style.display = 'block';
  }

  async processWithAI(inputData, actionType) {
    const lm = window.ai?.languageModel || window.LanguageModel;
    if (!lm) throw new Error("AI Language Model not found.");
    
    let systemPrompt = "You are an analytical AI. Provide a JSON response.";
    let userPrompt = "";

    if (actionType === 'semantic') {
      userPrompt = `Analyze the following text and perform Semantic Extraction. Identify key entities, main themes, and a brief summary.
      Also provide 3-5 keywords with importance scores (1 to 10) for visualization.
      Return ONLY valid JSON matching this structure:
      {
        "summary": "Brief summary",
        "entities": ["entity1", "entity2"],
        "themes": ["theme1", "theme2"],
        "chartData": {
          "labels": ["keyword1", "keyword2"],
          "scores": [8, 5]
        }
      }
      
      Text to analyze:
      ${inputData}`;
    } else if (actionType === 'sentiment') {
      userPrompt = `Analyze the sentiment, tone, and emotional intent of the following text.
      Provide 3-5 emotional traits with intensity scores (1 to 10) for visualization.
      Return ONLY valid JSON matching this structure:
      {
        "tone": "Primary tone (e.g. Positive, Urgent)",
        "intent": "Emotional intent",
        "summary": "Brief analysis",
        "chartData": {
          "labels": ["Joy", "Urgency", "Frustration"],
          "scores": [2, 8, 5]
        }
      }
      
      Text to analyze:
      ${inputData}`;
    } else {
      userPrompt = `Analyze the following text based on general context.
      Provide a summary, key insights, and 3-5 metrics/scores (1 to 10) representing the importance of different topics found.
      Return ONLY valid JSON matching this structure:
      {
        "summary": "Detailed response",
        "insights": ["insight1", "insight2"],
        "chartData": {
          "labels": ["Topic1", "Topic2"],
          "scores": [7, 4]
        }
      }
      
      Text to analyze:
      ${inputData}`;
    }

    try {
      const session = await lm.create({ systemPrompt, output: 'en' });
      const responseText = await session.prompt(userPrompt);
      return this.parseJSON(responseText);
    } catch (e) {
      throw new Error("Failed to process with AI.");
    }
  }

  parseJSON(text) {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No JSON found");
      return JSON.parse(text.slice(start, end + 1));
    } catch (e) {
      console.error("Parse error on:", text);
      return {
        summary: "Could not parse structured response.",
        chartData: { labels: ["Data"], scores: [5] }
      };
    }
  }

  renderResults(data, actionType) {
    this.showResults();
    
    // Render Text
    let html = '';
    if (actionType === 'semantic') {
      html += `<div class="insight-item"><div class="insight-label">Summary</div><div>${data.summary || 'N/A'}</div></div>`;
      if (data.entities) html += `<div class="insight-item"><div class="insight-label">Key Entities</div><div>${data.entities.join(', ')}</div></div>`;
      if (data.themes) html += `<div class="insight-item"><div class="insight-label">Main Themes</div><div>${data.themes.join(', ')}</div></div>`;
    } else if (actionType === 'sentiment') {
      html += `<div class="insight-item"><div class="insight-label">Tone</div><div><strong>${data.tone || 'N/A'}</strong></div></div>`;
      html += `<div class="insight-item"><div class="insight-label">Emotional Intent</div><div>${data.intent || 'N/A'}</div></div>`;
      html += `<div class="insight-item"><div class="insight-label">Analysis</div><div>${data.summary || 'N/A'}</div></div>`;
    } else {
      html += `<div class="insight-item"><div class="insight-label">Summary</div><div>${data.summary || 'N/A'}</div></div>`;
      if (data.insights) html += `<div class="insight-item"><div class="insight-label">Key Insights</div><div><ul>${data.insights.map(i => `<li>${i}</li>`).join('')}</ul></div></div>`;
    }
    this.textResults.innerHTML = html;

    // Render Chart
    if (data.chartData && data.chartData.labels && data.chartData.scores) {
      this.drawChart(data.chartData.labels, data.chartData.scores);
    } else {
      this.drawChart(["No Data"], [0]);
    }
  }

  drawChart(labels, values) {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    
    const ctx = this.mainChartCanvas.getContext('2d');
    
    // Add gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // --accent-blue
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Score',
          data: values,
          backgroundColor: gradient,
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif", size: 10 } }
          },
          y: {
            grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
            ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif", size: 10 }, beginAtZero: true, max: 10 }
          }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ContentAnalyzer();
});