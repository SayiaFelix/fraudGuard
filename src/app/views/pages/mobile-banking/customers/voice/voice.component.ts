import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { Subscription, interval } from 'rxjs';

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

interface FeatureImportance {
  feature: string;
  importance: number;
  category: string;
}

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements OnInit, OnDestroy {

  selectedPeriod: '24h' | '7d' | '30d' | '90d' = '7d';
  
  // Loading states
  isLoading = true;
  isLoadingStats = true;
  isLoadingInsights = true;
  isLoadingModelMetrics = true;
  isLoadingFeatureImportance = true;
  isLoadingFraudTrends = true;
  
  stats = {
    totalPredictions: 0,
    avgConfidence: 0,
    fraudDetected: 0,
    preventedLoss: 0,
    modelAccuracy: 0,
    activeModels: 0
  };

  insights: InsightData[] = [];
  modelMetrics: ModelMetric[] = [];
  fraudTrends: FraudTrend[] = [];
  featureImportance: FeatureImportance[] = [];

  transactions: any[] = [];
  auditLogs: any[] = [];
  modelMetricsData: any = null;
  
  private refreshSubscription?: Subscription;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadAllData();
    
    this.refreshSubscription = interval(600000).subscribe(() => {
      this.loadAllData();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadAllData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.loadTransactions(),
      this.loadAuditLog(),
      this.loadModelMetrics(),
      this.loadFeatureImportance()
    ]).then(() => {
      this.calculateStats();
      this.generateInsights();
      this.calculateModelMetrics();
      this.calculateFraudTrends();
      this.isLoading = false;
    }).catch(() => {
      this.isLoading = false;
    });
  }

  loadTransactions(): Promise<void> {
    this.isLoadingStats = true;
    return new Promise((resolve) => {
      this.httpService.getTransactions(1, 100).subscribe({
        next: (response) => {
          if (response.status === 'success' && response.transactions) {
            this.transactions = response.transactions;
          }
          this.isLoadingStats = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.isLoadingStats = false;
          resolve();
        }
      });
    });
  }

  loadAuditLog(): Promise<void> {
    return new Promise((resolve) => {
      this.httpService.getAuditLog().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.logs) {
            this.auditLogs = response.logs;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading audit log:', error);
          resolve();
        }
      });
    });
  }

  loadModelMetrics(): Promise<void> {
    this.isLoadingModelMetrics = true;
    return new Promise((resolve) => {
      this.httpService.getModelMetrics().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.metrics) {
            this.modelMetricsData = response;
          }
          this.isLoadingModelMetrics = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading model metrics:', error);
          this.isLoadingModelMetrics = false;
          resolve();
        }
      });
    });
  }

  loadFeatureImportance(): Promise<void> {
    this.isLoadingFeatureImportance = true;
    return new Promise((resolve) => {
      this.httpService.getFeatureImportance().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.feature_importance) {
            const featureData = response.feature_importance;
            
            this.featureImportance = Object.entries(featureData)
              .map(([featureName, data]: [string, any]) => ({
                feature: this.mapFeatureToDisplayName(featureName),
                importance: data.Combined_Weight,
                category: this.determineFeatureCategory(featureName)
              }))
              .sort((a, b) => b.importance - a.importance)
              .slice(0, 10);
          }
          this.isLoadingFeatureImportance = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading feature importance:', error);
          this.setDefaultFeatureImportance();
          this.isLoadingFeatureImportance = false;
          resolve();
        }
      });
    });
  }

  calculateStats(): void {
    this.stats.totalPredictions = this.transactions.length;
    
    this.stats.fraudDetected = this.transactions.filter(t => 
      t.risk_category === 'Critical Fraud Risk' || 
      t.risk_category === 'High Potential Fraud'
    ).length;
    
    this.stats.preventedLoss = this.transactions
      .filter(t => t.risk_category === 'Critical Fraud Risk' || t.risk_category === 'High Potential Fraud')
      .reduce((sum, t) => sum + (t.transaction_details?.Transaction_Amount || 0), 0);
    
    if (this.modelMetricsData?.metrics) {
      const models = Object.values(this.modelMetricsData.metrics) as any[];
      if (models.length > 0) {
        const avgAccuracy = models.reduce((sum, m) => sum + (m.accuracy || 0), 0) / models.length;
        this.stats.modelAccuracy = Math.round(avgAccuracy * 10000) / 100; 
      }
      
      this.stats.activeModels = Object.keys(this.modelMetricsData.metrics).length;
    }
    
    if (this.transactions.length > 0) {
      const avgRisk = this.transactions.reduce((sum, t) => sum + (t.risk_score || 0), 0) / this.transactions.length;
      this.stats.avgConfidence = Math.round((10 - avgRisk) * 10); 
    } else {
      this.stats.avgConfidence = 0;
    }
  }

  generateInsights(): void {
    this.isLoadingInsights = true;
    const newInsights: InsightData[] = [];
    
    const recentCritical = this.transactions
      .filter(t => t.risk_category === 'Critical Fraud Risk')
      .slice(0, 3);
    
    if (recentCritical.length > 0) {
      const totalAmount = recentCritical.reduce((sum, t) => sum + (t.transaction_details?.Transaction_Amount || 0), 0);
      
      newInsights.push({
        id: 'insight-critical-1',
        title: `${recentCritical.length} Critical Fraud Transactions Detected`,
        description: `AI models have identified ${recentCritical.length} critical fraud transactions requiring immediate attention.`,
        type: 'fraud_pattern',
        severity: 'critical',
        timestamp: new Date(recentCritical[0]?.timestamp || Date.now()),
        confidence: 98,
        details: {
          affectedTransactions: recentCritical.length,
          amount: totalAmount,
          modelsInvolved: ['Random Forest', 'XGBoost', 'Ensemble'],
          signals: recentCritical.map(t => t.transaction_details?.Rule_Flags || []).flat().slice(0, 5),
          recommendedAction: 'Review and block these transactions immediately'
        },
        expanded: false
      });
    }
    
    const recentHigh = this.transactions
      .filter(t => t.risk_category === 'High Potential Fraud')
      .slice(0, 5);
    
    if (recentHigh.length > 2) {
      const commonRules = recentHigh
        .map(t => t.transaction_details?.Rule_Flags || [])
        .flat()
        .reduce((acc: any, rule: string) => {
          acc[rule] = (acc[rule] || 0) + 1;
          return acc;
        }, {});
      
      const topRule = Object.entries(commonRules)
        .sort((a: any, b: any) => b[1] - a[1])
        .map(entry => entry[0])[0];
      
      if (topRule) {
        newInsights.push({
          id: 'insight-pattern-1',
          title: `Emerging Pattern: ${topRule}`,
          description: `Multiple high-risk transactions share common pattern: ${topRule}`,
          type: 'risk_trend',
          severity: 'high',
          timestamp: new Date(),
          confidence: 87,
          details: {
            affectedTransactions: recentHigh.length,
            amount: recentHigh.reduce((sum, t) => sum + (t.transaction_details?.Transaction_Amount || 0), 0),
            signals: [topRule],
            recommendedAction: `Review rules for ${topRule} and consider additional verification`
          },
          expanded: false
        });
      }
    }
    
    if (this.modelMetricsData?.metrics) {
      const xgb = this.modelMetricsData.metrics['XGBoost'];
      if (xgb && xgb.recall < 0.95) {
        newInsights.push({
          id: 'insight-model-1',
          title: 'XGBoost Performance Degradation',
          description: `XGBoost recall is at ${(xgb.recall * 100).toFixed(1)}%, below the 95% threshold.`,
          type: 'model_update',
          severity: 'medium',
          timestamp: new Date(),
          confidence: 92,
          details: {
            modelsInvolved: ['XGBoost'],
            recommendedAction: 'Consider retraining XGBoost with recent data'
          },
          expanded: false
        });
      }
    }
    
    const recentAnomalies = this.auditLogs
      .filter(log => log.risk_score > 8)
      .slice(0, 2);
    
    if (recentAnomalies.length > 0) {
      newInsights.push({
        id: 'insight-anomaly-1',
        title: 'High-Scoring Transactions Detected',
        description: `${recentAnomalies.length} transactions with risk score > 8 detected recently.`,
        type: 'anomaly',
        severity: 'high',
        timestamp: new Date(recentAnomalies[0]?.timestamp || Date.now()),
        confidence: 95,
        details: {
          affectedTransactions: recentAnomalies.length,
          amount: recentAnomalies.reduce((sum, log) => sum + (log.transaction_details?.Transaction_Amount || 0), 0),
          recommendedAction: 'Review these high-risk transactions immediately'
        },
        expanded: false
      });
    }
    
    this.insights = newInsights.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    ).slice(0, 10);
    
    this.isLoadingInsights = false;
  }

  calculateModelMetrics(): void {
    this.isLoadingModelMetrics = true;
    const metrics: ModelMetric[] = [];
    
    if (this.modelMetricsData?.metrics) {
      const models = this.modelMetricsData.metrics;
      
      Object.entries(models).forEach(([name, data]: [string, any]) => {
        metrics.push({
          name: name,
          accuracy: Math.round(data.accuracy * 10000) / 100,
          precision: Math.round(data.precision * 10000) / 100,
          recall: Math.round(data.recall * 10000) / 100,
          f1Score: Math.round(data.f1_score * 10000) / 100,
          lastTrained: new Date(),
          status: data.accuracy > 0.98 ? 'active' : 
                  data.accuracy > 0.95 ? 'training' : 'degraded'
        });
      });
    }
    
    this.modelMetrics = metrics;
    this.isLoadingModelMetrics = false;
  }

  calculateFraudTrends(): void {
    this.isLoadingFraudTrends = true;
    const dailyData: { [key: string]: { actual: number; predicted: number } } = {};
    
    this.transactions.forEach(t => {
      const date = new Date(t.timestamp).toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = { actual: 0, predicted: 0 };
      }
      
      if (t.risk_category === 'Critical Fraud Risk' || t.risk_category === 'High Potential Fraud') {
        dailyData[date].actual++;
        dailyData[date].predicted = Math.round(dailyData[date].actual * (0.9 + Math.random() * 0.2));
      }
    });
    
    this.fraudTrends = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        predicted: data.predicted,
        actual: data.actual,
        confidence: Math.round(85 + Math.random() * 10)
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
      
    this.isLoadingFraudTrends = false;
  }

  mapFeatureToDisplayName(featureName: string): string {
    const nameMap: { [key: string]: string } = {
      'Transaction_Amount': 'Transaction Amount',
      'Transaction_Frequency': 'Transaction Frequency',
      'Transaction_Hour': 'Time of Day',
      'Day_of_Week': 'Day of Week',
      'IP_Address': 'IP Address',
      'Account_Activity': 'Account Activity',
      'Amount_Category_Low': 'Low Amount',
      'Amount_Category_Medium': 'Medium Amount',
      'Amount_Category_High': 'High Amount',
      'Amount_Category_Very High': 'Very High Amount',
      'Transaction_Location_Local': 'Local Location',
      'Transaction_Location_International': 'International Location',
      'Device_Type_iPhone': 'iPhone Device',
      'Device_Type_MacBook': 'MacBook Device',
      'Device_Type_Unknown_Device': 'Unknown Device',
      'Transaction_Type_Online': 'Online Transaction',
      'Transaction_Type_POS': 'POS Transaction',
      'Transaction_Period_Morning': 'Morning Period',
      'Transaction_Period_Afternoon': 'Afternoon Period',
      'Transaction_Period_Evening': 'Evening Period'
    };
    
    return nameMap[featureName] || featureName.replace(/_/g, ' ');
  }

  determineFeatureCategory(featureName: string): string {
    if (featureName.includes('Amount')) return 'amount';
    if (featureName.includes('Device')) return 'device';
    if (featureName.includes('Location')) return 'geographic';
    if (featureName.includes('Period') || featureName.includes('Hour') || featureName.includes('Day')) return 'temporal';
    if (featureName.includes('Frequency')) return 'behavioral';
    if (featureName.includes('Type') && (featureName.includes('Online') || featureName.includes('POS'))) return 'channel';
    if (featureName.includes('IP')) return 'network';
    if (featureName.includes('Activity')) return 'historical';
    return 'other';
  }

  setDefaultFeatureImportance(): void {
    this.featureImportance = [
      { feature: 'Transaction Amount', importance: 0.35, category: 'amount' },
      { feature: 'Device Type', importance: 0.25, category: 'device' },
      { feature: 'Location', importance: 0.18, category: 'geographic' },
      { feature: 'Time of Day', importance: 0.12, category: 'temporal' },
      { feature: 'Transaction Frequency', importance: 0.07, category: 'behavioral' },
      { feature: 'Channel Type', importance: 0.03, category: 'channel' }
    ];
  }

  toggleInsight(insight: InsightData): void {
    insight.expanded = !insight.expanded;
  }

  getInsightIcon(type: string): string {
    const icons: any = {
      'fraud_pattern': 'fas fa-exclamation-triangle',
      'model_update': 'fas fa-microchip',
      'risk_trend': 'fas fa-chart-line',
      'recommendation': 'fas fa-lightbulb',
      'anomaly': 'fas fa-bolt'
    };
    return icons[type] || 'fas fa-info-circle';
  }

  getInsightBadgeClass(type: string): string {
    const classes: any = {
      'fraud_pattern': 'border border-2 border-danger text-dark',
      'model_update': 'border border-2 border-primary text-dark',
      'risk_trend': 'border border-2 border-warning text-dark',
      'recommendation': 'border border-2 border-success text-dark',
      'anomaly': 'border border-2 border-info text-dark'
    };
    return classes[type] || 'bg-secondary';
  }

  getSeverityBadgeClass(severity?: string): string {
    const classes: any = {
      'critical': 'bg-danger',
      'high': 'bg-warning text-dark',
      'medium': 'bg-info',
      'low': 'bg-success'
    };
    return classes[severity || ''] || 'bg-secondary';
  }

  getModelStatusClass(status: string): string {
    const classes: any = {
      'active': 'bg-success',
      'training': 'bg-warning text-dark',
      'degraded': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
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
    const icons: any = {
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
    return icons[category] || 'fas fa-tag';
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
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      insights: this.insights,
      modelMetrics: this.modelMetrics,
      fraudTrends: this.fraudTrends,
      featureImportance: this.featureImportance
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ai-insights-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Insights report exported successfully!');
  }

  changePeriod(period: '24h' | '7d' | '30d' | '90d'): void {
    this.selectedPeriod = period;
    this.loadAllData(); 
  }
}