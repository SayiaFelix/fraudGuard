import { Component, OnDestroy, OnInit } from '@angular/core';

interface InsightData {
  id: string;
  title: string;
  description: string;
  type: 'fraud_pattern' | 'model_update' | 'risk_trend' | 'recommendation' | 'anomaly';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  confidence: number;
  details: {
    affectedTransactions?: number;
    amount?: number;
    modelsInvolved?: string[];
    signals?: string[];
    recommendedAction?: string;
  };
  expanded?: boolean;
}

interface ModelMetric {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  status: 'active' | 'training' | 'degraded';
}

interface FraudTrend {
  date: string;
  predicted: number;
  actual: number;
  confidence: number;
}

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements OnInit, OnDestroy {

  selectedPeriod: '24h' | '7d' | '30d' | '90d' = '7d';
  
  stats = {
    totalPredictions: 158432,
    avgConfidence: 94.2,
    fraudDetected: 1284,
    preventedLoss: 2450000,
    modelAccuracy: 98.5,
    activeModels: 7
  };

  // AI Insights
  insights: InsightData[] = [
    {
      id: 'insight-1',
      title: 'New Fraud Pattern Detected: SIM Swap + Large Transfer',
      description: 'LLM analysis has identified a coordinated pattern involving SIM swaps followed by large transfers within 3 hours.',
      type: 'fraud_pattern',
      severity: 'critical',
      timestamp: new Date(Date.now() - 2 * 3600000),
      confidence: 96,
      details: {
        affectedTransactions: 23,
        amount: 3450000,
        modelsInvolved: ['Random Forest', 'XGBoost', 'CatBoost', 'Ensemble (Weighted)'],
        signals: ['SIM Swap Event', 'Large Transfer', 'New Device', 'Location Mismatch'],
        recommendedAction: 'Implement cool-down period after SIM swap for large transfers'
      },
      expanded: false
    },
    {
      id: 'insight-2',
      title: 'Model Retraining Recommended: Drift Detected in XGBoost',
      description: 'Performance degradation detected in XGBoost model for mobile channel transactions. Accuracy dropped from 97.2% to 94.1%.',
      type: 'model_update',
      severity: 'high',
      timestamp: new Date(Date.now() - 5 * 3600000),
      confidence: 89,
      details: {
        affectedTransactions: 1250,
        modelsInvolved: ['XGBoost'],
        recommendedAction: 'Schedule retraining with last 7 days of data'
      },
      expanded: false
    },
        {
      id: 'insight-3',
      title: 'LLM Explanation Quality Improved',
      description: 'Recent fine-tuning has improved explanation quality by 23%. Customer-facing explanations are now clearer and more actionable.',
      type: 'recommendation',
      severity: 'low',
      timestamp: new Date(Date.now() - 2 * 86400000),
      confidence: 100,
      details: {
        recommendedAction: 'Continue using enhanced prompts for fraud notifications'
      },
      expanded: false
    },
    {
      id: 'insight-4',
      title: 'Emerging Risk: Agent Channel Fraud in Western Region',
      description: 'Unusual pattern detected in agent transactions from Kisumu and Eldoret. Fraud cases up 156% week-over-week.',
      type: 'risk_trend',
      severity: 'high',
      timestamp: new Date(Date.now() - 12 * 3600000),
      confidence: 92,
      details: {
        affectedTransactions: 67,
        amount: 890000,
        signals: ['Agent Clusters', 'Amount Patterns', 'Time Analysis'],
        recommendedAction: 'Deploy additional verification for agent transactions in these regions'
      },
      expanded: false
    },
    {
      id: 'insight-5',
      title: 'Ensemble Weight Optimization Complete',
      description: 'Adaptive weighting system has optimized model contributions based on recent feedback. XGBoost weight increased by 15%.',
      type: 'model_update',
      severity: 'medium',
      timestamp: new Date(Date.now() - 1 * 86400000),
      confidence: 100,
      details: {
        modelsInvolved: ['Random Forest', 'XGBoost', 'LightGBM', 'CatBoost','Essemble (Weighted)'],
        recommendedAction: 'Monitor performance for next 24 hours'
      },
      expanded: false
    },
     {
    id: 'insight-6',
    title: 'Unusual Transaction Velocity in Nairobi CBD',
    description: 'Multiple high-value transactions (>KES 200K) detected from same IP range within 30-minute window. Pattern suggests possible automated attack.',
    type: 'anomaly',
    severity: 'high',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    confidence: 94,
    details: {
      affectedTransactions: 8,
      amount: 1850000,
      modelsInvolved: ['LightGBM', 'XGBoost', 'Ensemble'],
      signals: ['High Velocity', 'Same IP Range', 'Unusual Hours', 'Amount Clustering'],
      recommendedAction: 'Temporarily block IP range and review transactions manually'
    },
    expanded: false
  },
    {
      id: 'insight-7',
      title: 'New Fraud Ring Identified: Mule Account Network',
      description: 'Graph analysis has identified 12 accounts acting as mules, moving funds through a complex network of 45 transactions.',
      type: 'fraud_pattern',
      severity: 'critical',
      timestamp: new Date(Date.now() - 1.5 * 86400000),
      confidence: 97,
      details: {
        affectedTransactions: 45,
        amount: 5670000,
        modelsInvolved: ['Graph Neural Network', 'Random Forest'],
        signals: ['Circular Transactions', 'Rapid Movement', 'Common Devices'],
        recommendedAction: 'Freeze identified accounts and investigate connected customers'
      },
      expanded: false
    },
    
  ];

  modelMetrics: ModelMetric[] = [
    {
      name: 'Random Forest',
      accuracy: 97.8,
      precision: 96.2,
      recall: 95.1,
      f1Score: 95.6,
      lastTrained: new Date(Date.now() - 2 * 86400000),
      status: 'active'
    },
    {
      name: 'XGBoost',
      accuracy: 98.2,
      precision: 97.1,
      recall: 96.3,
      f1Score: 96.7,
      lastTrained: new Date(Date.now() - 1 * 86400000),
      status: 'active'
    },
    {
      name: 'LightGBM',
      accuracy: 97.5,
      precision: 95.8,
      recall: 94.9,
      f1Score: 95.3,
      lastTrained: new Date(Date.now() - 3 * 86400000),
      status: 'active'
    },
    {
      name: 'CatBoost',
      accuracy: 98.1,
      precision: 96.9,
      recall: 95.8,
      f1Score: 96.3,
      lastTrained: new Date(Date.now() - 2 * 86400000),
      status: 'active'
    },
    {
      name: 'Graph Neural Network',
      accuracy: 96.3,
      precision: 94.7,
      recall: 92.8,
      f1Score: 93.7,
      lastTrained: new Date(Date.now() - 5 * 86400000),
      status: 'degraded'
    },
    {
      name: 'Ensemble (Weighted)',
      accuracy: 98.9,
      precision: 98.2,
      recall: 97.8,
      f1Score: 98.0,
      lastTrained: new Date(Date.now() - 1 * 86400000),
      status: 'active'
    }
  ];

  fraudTrends: FraudTrend[] = [
    { date: '2024-02-18', predicted: 245, actual: 238, confidence: 92 },
    { date: '2024-02-19', predicted: 267, actual: 259, confidence: 91 },
    { date: '2024-02-20', predicted: 289, actual: 301, confidence: 89 },
    { date: '2024-02-21', predicted: 312, actual: 308, confidence: 93 },
    { date: '2024-02-22', predicted: 334, actual: 342, confidence: 90 },
    { date: '2024-02-23', predicted: 356, actual: 378, confidence: 88 },
    { date: '2024-02-24', predicted: 378, actual: 365, confidence: 91 }
  ];

  featureImportance = [
    { feature: 'Transaction Amount', importance: 0.24, category: 'amount' },
    { feature: 'Device Fingerprint', importance: 0.18, category: 'device' },
    { feature: 'Transaction Velocity', importance: 0.15, category: 'behavioral' },
    { feature: 'Location Mismatch', importance: 0.12, category: 'geographic' },
    { feature: 'Time of Day', importance: 0.09, category: 'temporal' },
    { feature: 'Channel Type', importance: 0.08, category: 'channel' },
    { feature: 'IP Reputation', importance: 0.07, category: 'network' },
    { feature: 'Customer History', importance: 0.05, category: 'historical' },
    { feature: 'Agent Trust Score', importance: 0.02, category: 'agent' }
  ];

  constructor() {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {}

  toggleInsight(insight: InsightData): void {
    insight.expanded = !insight.expanded;
  }

  getInsightIcon(type: string): string {
    const icons = {
      'fraud_pattern': 'fas fa-exclamation-triangle',
      'model_update': 'fas fa-microchip',
      'risk_trend': 'fas fa-chart-line',
      'recommendation': 'fas fa-lightbulb',
      'anomaly': 'fas fa-bolt'
    };
    return icons[type as keyof typeof icons] || 'fas fa-info-circle';
  }

  getInsightBadgeClass(type: string): string {
    const classes = {
      'fraud_pattern': 'border border-2 border-danger text-dark',
      'model_update': 'border border-2 border-primary text-dark',
      'risk_trend': 'border border-2 border-warning text-dark',
      'recommendation': 'border border-2 border-success text-dark',
      'anomaly': 'border border-2 border-info text-dark'
    };
    return classes[type as keyof typeof classes] || 'bg-secondary';
  }

  getSeverityBadgeClass(severity?: string): string {
    const classes = {
      'critical': 'bg-danger',
      'high': 'bg-warning text-dark',
      'medium': 'bg-info',
      'low': 'bg-success'
    };
    return classes[severity as keyof typeof classes] || 'bg-secondary';
  }

  getModelStatusClass(status: string): string {
    const classes = {
      'active': 'bg-success',
      'training': 'bg-warning text-dark',
      'degraded': 'bg-danger'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getFeatureImportanceColor(importance: number): string {
    if (importance >= 0.2) return '#f72585';
    if (importance >= 0.15) return '#ff9e00';
    if (importance >= 0.1) return '#4cc9f0';
    return '#06d6a0';
  }

  getCategoryIcon(category: string): string {
    const icons = {
      'amount': 'fas fa-coins',
      'device': 'fas fa-mobile-alt',
      'behavioral': 'fas fa-chart-line',
      'geographic': 'fas fa-map-marker-alt',
      'temporal': 'fas fa-clock',
      'channel': 'fas fa-route',
      'network': 'fas fa-network-wired',
      'historical': 'fas fa-history',
      'agent': 'fas fa-user-tie'
    };
    return icons[category as keyof typeof icons] || 'fas fa-tag';
  }

  retrainModel(modelName: string): void {
    alert(`Initiating retraining for ${modelName}...`);
  }

  viewFullReport(insightId: string): void {
    console.log('Viewing full report for:', insightId);
  }

  takeRecommendedAction(insight: InsightData): void {
    if (insight.details.recommendedAction) {
      alert(`Action: ${insight.details.recommendedAction}`);
    }
  }

  exportInsights(): void {
    alert('Exporting insights report ready in production ...');
  }

  changePeriod(period: '24h' | '7d' | '30d' | '90d'): void {
    this.selectedPeriod = period;
  }
  
}