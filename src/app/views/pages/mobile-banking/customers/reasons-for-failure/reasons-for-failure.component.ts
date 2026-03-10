import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

interface GraphNode {
  id: string;
  name: string;
  type: 'customer' | 'device' | 'account' | 'transaction' | 'phone' | 'ip' | 'location';
  riskScore?: number;
  riskCategory?: 'Critical' | 'High' | 'Medium' | 'Low';
  amount?: number;
  timestamp?: Date;
  flagged?: boolean;
  x?: number;
  y?: number;
  transactionId?: string; 
}

interface GraphLink {
  source: string;
  target: string;
  type: 'transacted' | 'uses_device' | 'connected_to' | 'same_ip' | 'same_phone' | 'transferred_to';
  count?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

@Component({
  selector: 'app-reasons-for-failure',
  templateUrl: './reasons-for-failure.component.html',
  styleUrls: ['./reasons-for-failure.component.scss'],
})
export class ReasonsForFailureComponent implements OnInit, OnDestroy {
 @ViewChild('graphCanvas') graphCanvas!: ElementRef<HTMLCanvasElement>;
  
  graphData: GraphData = { nodes: [], links: [] };
  filteredGraphData: GraphData = { nodes: [], links: [] };
  
  selectedNode: GraphNode | null = null;
  selectedNodeConnections: { nodes: GraphNode[], links: GraphLink[] } = { nodes: [], links: [] };
  
  // Investigation context
  investigationAlertId: string | null = null;
  investigationNode: GraphNode | null = null;
  isInvestigationMode = false;
  
  // Filters
  showCriticalOnly = false;
  showHighOnly = false;
  showTransactions = true;
  showCustomers = true;
  showDevices = true;
  showAccounts = true;
  searchTerm = '';
  timeRange: '1h' | '24h' | '7d' | '30d' | 'all' = '24h';
  
  // Stats
  stats = {
    totalNodes: 0,
    totalLinks: 0,
    criticalNodes: 0,
    highNodes: 0,
    mediumNodes: 0,
    lowNodes: 0,
    fraudRings: 3,
    connectedAccounts: 12
  };

  fraudRings = [
    { id: 'ring-1', name: 'Nairobi Fraud Ring', size: 8, totalAmount: 2450000, riskLevel: 'Critical' },
    { id: 'ring-2', name: 'Mombasa Mule Network', size: 5, totalAmount: 1890000, riskLevel: 'High' },
    { id: 'ring-3', name: 'SIM Swap Syndicate', size: 4, totalAmount: 3200000, riskLevel: 'Critical' }
  ];

  private nodePositions: Map<string, { x: number, y: number }> = new Map();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    this.investigationAlertId = params.get('id');
    this.generateMockGraphData();
    
    console.log('After generateMockGraphData - Total nodes:', this.graphData.nodes.length);
    
    if (this.investigationAlertId) {
      this.enterInvestigationMode(this.investigationAlertId);
    } else {
      this.isInvestigationMode = false;
      this.filteredGraphData = { 
        nodes: [...this.graphData.nodes], 
        links: [...this.graphData.links] 
      };
      this.applyFilters();
    }
    
    this.calculateStats(); 
    this.calculateNodePositions();
    
    setTimeout(() => {
      this.drawGraph();
    }, 100);
  });
}

showFuturePreview: boolean = true;
futureReleaseDate: string = 'Q3 2026';


showRoadmap(): void {
  const roadmap = `
    FinGuard AI - Product Roadmap
    
    Phase 1-3 (Current - March 2026):
    • Core ML Models (Random Forest, XGBoost, LightGBM, CatBoost)
    • Hybrid Rule Engine
    • LLM-powered Explanations
    • Real-time Dashboard & Risk Analyzer
    
    Phase 4 (Next - Q2 2026):
    • Agentic AI Response System
    • Automated Actions (Block/Flag/Approve)
    • Human-in-the-loop Feedback
    
    Phase 5-6 (Post-Hackathon - Q3 2026):
    • Real world data integration
    • Graph-based Fraud Detection
    • Neo4j Integration
    • Real-time Fraud Rings Detection
    • Cross-border Transaction Analysis
    • CBK Reporting Integration
  `;
  
  alert(roadmap);
}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawGraph();
    }, 100);
  }

  private filterGraphForInvestigation(centerNode: GraphNode): void {

  const connectedNodeIds = new Set<string>();
  connectedNodeIds.add(centerNode.id);
  
  this.graphData.links.forEach(link => {
    if (link.source === centerNode.id) {
      connectedNodeIds.add(link.target as string);
    }
    if (link.target === centerNode.id) {
      connectedNodeIds.add(link.source as string);
    }
  });
  
  this.filteredGraphData.nodes = this.graphData.nodes.filter(node => 
    connectedNodeIds.has(node.id)
  );
  
  this.filteredGraphData.links = this.graphData.links.filter(link => 
    connectedNodeIds.has(link.source as string) && connectedNodeIds.has(link.target as string)
  );
  
  console.log('Investigation mode - filtered nodes:', this.filteredGraphData.nodes.length);
  console.log('Investigation mode - filtered links:', this.filteredGraphData.links.length);
  
  this.calculateNodePositions();
  this.drawGraph();
}

ngOnDestroy(): void {
  console.log('Component destroyed');
}

exitInvestigationMode(): void {
    this.isInvestigationMode = false;
    this.investigationNode = null;
    this.clearSelection();
    this.resetFilters();
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph']);
  }

  private generateMockGraphData(): void {
  const customers: GraphNode[] = [
    { id: 'cust-1', name: 'John Mwangi', type: 'customer', riskScore: 9.2, riskCategory: 'Critical', flagged: true },
    { id: 'cust-2', name: 'Sarah Omondi', type: 'customer', riskScore: 8.7, riskCategory: 'Critical', flagged: true },
    { id: 'cust-3', name: 'Peter Ochieng', type: 'customer', riskScore: 7.8, riskCategory: 'High', flagged: true },
    { id: 'cust-4', name: 'Mary Akinyi', type: 'customer', riskScore: 7.2, riskCategory: 'High' },
    { id: 'cust-5', name: 'James Kipchoge', type: 'customer', riskScore: 6.5, riskCategory: 'Medium' },
    { id: 'cust-6', name: 'Elizabeth Wanjiku', type: 'customer', riskScore: 9.8, riskCategory: 'Critical', flagged: true },
    { id: 'cust-7', name: 'David Kimani', type: 'customer', riskScore: 4.2, riskCategory: 'Low' },
    { id: 'cust-8', name: 'Grace Auma', type: 'customer', riskScore: 8.1, riskCategory: 'High', flagged: true },
  ];

  const devices: GraphNode[] = [
    { id: 'dev-1', name: 'Samsung A52', type: 'device', riskScore: 9.2 },
    { id: 'dev-2', name: 'iPhone 13', type: 'device', riskScore: 8.7 },
    { id: 'dev-3', name: 'Web Browser', type: 'device', riskScore: 7.8 },
    { id: 'dev-4', name: 'Unknown Device', type: 'device', riskScore: 9.8, flagged: true },
    { id: 'dev-5', name: 'Agent Terminal', type: 'device', riskScore: 6.5 },
  ];

  const accounts: GraphNode[] = [
    { id: 'acc-1', name: 'Account #88432', type: 'account', amount: 450000 },
    { id: 'acc-2', name: 'Account #77651', type: 'account', amount: 275000 },
    { id: 'acc-3', name: 'Account #99234', type: 'account', amount: 89000 },
    { id: 'acc-4', name: 'Account #12378', type: 'account', amount: 1250000, flagged: true },
  ];

  const phones: GraphNode[] = [
    { id: 'phone-1', name: '+254 712 345 678', type: 'phone' },
    { id: 'phone-2', name: '+254 723 456 789', type: 'phone' },
    { id: 'phone-3', name: '+254 734 567 890', type: 'phone', flagged: true },
  ];

  const ips: GraphNode[] = [
    { id: 'ip-1', name: '197.248.0.45', type: 'ip' },
    { id: 'ip-2', name: '105.27.143.78', type: 'ip' },
    { id: 'ip-3', name: '154.122.89.34', type: 'ip' },
    { id: 'ip-4', name: '45.123.89.156', type: 'ip', flagged: true },
  ];

  const locations: GraphNode[] = [
    { id: 'loc-1', name: 'Nairobi, KE', type: 'location' },
    { id: 'loc-2', name: 'Mombasa, KE', type: 'location' },
    { id: 'loc-3', name: 'International', type: 'location', flagged: true },
  ];

  const transactions: GraphNode[] = [
    { id: 'tx-1', name: 'TXN-001', type: 'transaction', amount: 450000, timestamp: new Date(), riskScore: 9.2, transactionId: 'TXN-2024-001' },
    { id: 'tx-2', name: 'TXN-002', type: 'transaction', amount: 275000, timestamp: new Date(), riskScore: 8.7, transactionId: 'TXN-2024-002' },
    { id: 'tx-3', name: 'TXN-003', type: 'transaction', amount: 89000, timestamp: new Date(), riskScore: 7.8, transactionId: 'TXN-2024-003' },
    { id: 'tx-4', name: 'TXN-004', type: 'transaction', amount: 1250000, timestamp: new Date(), riskScore: 9.8, transactionId: 'TXN-2024-004' },
  ];

  this.graphData.nodes = [
    ...customers, ...devices, ...accounts, ...phones, ...ips, ...locations, ...transactions
  ];

  this.graphData.links = [
    { source: 'cust-1', target: 'dev-1', type: 'uses_device', count: 23 },
    { source: 'cust-1', target: 'dev-2', type: 'uses_device', count: 5 },
    { source: 'cust-2', target: 'dev-2', type: 'uses_device', count: 17 },
    { source: 'cust-3', target: 'dev-3', type: 'uses_device', count: 8 },
    { source: 'cust-4', target: 'dev-4', type: 'uses_device', count: 2 },
    { source: 'cust-5', target: 'dev-5', type: 'uses_device', count: 12 },
    { source: 'cust-6', target: 'dev-4', type: 'uses_device', count: 1 },
    { source: 'cust-6', target: 'dev-1', type: 'uses_device', count: 3 },
    { source: 'cust-8', target: 'dev-2', type: 'uses_device', count: 4 },
    
    // Customer-account connections
    { source: 'cust-1', target: 'acc-1', type: 'connected_to' },
    { source: 'cust-2', target: 'acc-2', type: 'connected_to' },
    { source: 'cust-3', target: 'acc-3', type: 'connected_to' },
    { source: 'cust-6', target: 'acc-4', type: 'connected_to' },
    
    // Customer-phone connections
    { source: 'cust-1', target: 'phone-1', type: 'same_phone' },
    { source: 'cust-2', target: 'phone-2', type: 'same_phone' },
    { source: 'cust-3', target: 'phone-2', type: 'same_phone' },
    { source: 'cust-6', target: 'phone-3', type: 'same_phone' },
    
    // Customer-ip connections
    { source: 'cust-1', target: 'ip-1', type: 'same_ip' },
    { source: 'cust-2', target: 'ip-2', type: 'same_ip' },
    { source: 'cust-3', target: 'ip-3', type: 'same_ip' },
    { source: 'cust-6', target: 'ip-4', type: 'same_ip' },
    
    // Customer-location connections
    { source: 'cust-1', target: 'loc-1', type: 'connected_to' },
    { source: 'cust-2', target: 'loc-2', type: 'connected_to' },
    { source: 'cust-3', target: 'loc-1', type: 'connected_to' },
    { source: 'cust-6', target: 'loc-3', type: 'connected_to' },
    
    // Transaction connections
    { source: 'cust-1', target: 'tx-1', type: 'transacted' },
    { source: 'cust-2', target: 'tx-2', type: 'transacted' },
    { source: 'cust-3', target: 'tx-3', type: 'transacted' },
    { source: 'cust-6', target: 'tx-4', type: 'transacted' },
    
    // Cross connections (fraud ring)
    { source: 'dev-1', target: 'dev-2', type: 'connected_to', count: 3 },
    { source: 'phone-2', target: 'phone-3', type: 'connected_to' },
    { source: 'ip-1', target: 'ip-4', type: 'connected_to' },
    { source: 'acc-1', target: 'acc-4', type: 'transferred_to', count: 2 },
    { source: 'acc-2', target: 'acc-4', type: 'transferred_to', count: 1 },
  ];
}

private calculateNodePositions(): void {
    const centerX = 450;
    const centerY = 275;
    const radius = 200;
    
    let angleStep = (2 * Math.PI) / this.filteredGraphData.nodes.length;
    let angle = 0;
    
    this.filteredGraphData.nodes.forEach(node => {
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      this.nodePositions.set(node.id, { x, y });
      node.x = x;
      node.y = y;
      
      angle += angleStep;
    });
  }

private enterInvestigationMode(alertId: string): void {
  this.isInvestigationMode = true;
  
  console.log('Entering investigation mode for alert:', alertId);
  console.log('Available transaction nodes:', this.graphData.nodes.filter(n => n.type === 'transaction'));
  
  const transactionNode = this.graphData.nodes.find(node => 
    node.type === 'transaction' && (node.id === alertId || node.transactionId === alertId)
  );
  
  if (transactionNode) {
    console.log('Found transaction node:', transactionNode);
    this.investigationNode = transactionNode;
  
    this.filterGraphForInvestigation(transactionNode);
    
    setTimeout(() => {
      this.selectNode(transactionNode);
    }, 200);
  } else {
    console.warn('Transaction node not found for alert ID:', alertId);
    this.isInvestigationMode = false;
    this.filteredGraphData = { 
      nodes: [...this.graphData.nodes], 
      links: [...this.graphData.links] 
    };
    this.calculateNodePositions();
    this.drawGraph();
  }
}

  private drawGraph(): void {
    const canvas = this.graphCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 900;
    canvas.height = 550;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.isInvestigationMode && this.investigationNode) {
      ctx.save();
      ctx.fillStyle = 'rgba(67, 97, 238, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const pos = this.nodePositions.get(this.investigationNode.id);
      if (pos) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 40, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(67, 97, 238, 0.1)';
        ctx.fill();
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    this.filteredGraphData.links.forEach(link => {
      const sourcePos = this.nodePositions.get(link.source as string);
      const targetPos = this.nodePositions.get(link.target as string);
      
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = Math.sqrt(link.count || 1) * 1.5;
        
        if (link.type === 'connected_to') {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);

    this.filteredGraphData.nodes.forEach(node => {
      const pos = this.nodePositions.get(node.id);
      if (!pos) return;


      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.getNodeSize(node), 0, 2 * Math.PI);
      
      ctx.fillStyle = this.getNodeColor(node);
      ctx.fill();

      if (node.flagged) {
        ctx.strokeStyle = '#f72585';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }


      if (this.isInvestigationMode && this.investigationNode && node.id === this.investigationNode.id) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.getNodeSize(node) + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#4361ee';
        ctx.fillText('INVESTIGATING', pos.x - 40, pos.y - 20);
      }

      ctx.font = '10px Arial';
      ctx.fillStyle = '#334155';
      ctx.fillText(this.getNodeLabel(node), pos.x + 15, pos.y + 4);
    });

    this.setupClickHandler();
  }

  setupClickHandler(): void {
    const canvas = this.graphCanvas.nativeElement;
    
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const mouseX = (event.clientX - rect.left) * scaleX;
      const mouseY = (event.clientY - rect.top) * scaleY;

      let clickedNode: GraphNode | null = null;
      
      for (const node of this.filteredGraphData.nodes) {
        const pos = this.nodePositions.get(node.id);
        if (!pos) continue;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - pos.x, 2) + Math.pow(mouseY - pos.y, 2)
        );
        
        if (distance <= this.getNodeSize(node) + 5) {
          clickedNode = node;
          break;
        }
      }
      
      if (clickedNode) {
        this.selectNode(clickedNode);
      }
    });
  }

  selectNode(node: GraphNode): void {
    this.selectedNode = node;
    
    const connectedNodeIds = new Set<string>();
    const connectedLinks = this.graphData.links.filter(link => {
      if (link.source === node.id || link.target === node.id) {
        connectedNodeIds.add(link.source === node.id ? link.target as string : link.source as string);
        return true;
      }
      return false;
    });

    const connectedNodes = this.graphData.nodes.filter(n => 
      connectedNodeIds.has(n.id) || n.id === node.id
    );

    this.selectedNodeConnections = {
      nodes: connectedNodes,
      links: connectedLinks
    };

    this.highlightNode(node);
  }

  private highlightNode(selectedNode: GraphNode): void {
    const canvas = this.graphCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.drawGraph();
    
    const pos = this.nodePositions.get(selectedNode.id);
    if (pos) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.getNodeSize(selectedNode) + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#4361ee';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  clearSelection(): void {
    this.selectedNode = null;
    this.selectedNodeConnections = { nodes: [], links: [] };
    this.drawGraph();
  }

  applyFilters(): void {
    if (this.isInvestigationMode) {
      return;
    }
    
    this.filteredGraphData.nodes = this.graphData.nodes.filter(node => {
      if (this.showCriticalOnly && node.riskCategory !== 'Critical') return false;
      if (this.showHighOnly && node.riskCategory !== 'High') return false;
      
      // Type filters
      if (!this.showCustomers && node.type === 'customer') return false;
      if (!this.showDevices && node.type === 'device') return false;
      if (!this.showAccounts && node.type === 'account') return false;
      if (!this.showTransactions && node.type === 'transaction') return false;
      
      // Search
      if (this.searchTerm && !node.name.toLowerCase().includes(this.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    const visibleNodeIds = new Set(this.filteredGraphData.nodes.map(n => n.id));
    this.filteredGraphData.links = this.graphData.links.filter(link => 
      visibleNodeIds.has(link.source as string) && visibleNodeIds.has(link.target as string)
    );

    this.calculateNodePositions();
    this.drawGraph();
  }

  resetFilters(): void {
    this.showCriticalOnly = false;
    this.showHighOnly = false;
    this.showTransactions = true;
    this.showCustomers = true;
    this.showDevices = true;
    this.showAccounts = true;
    this.searchTerm = '';
    this.timeRange = '24h';
    
    if (this.isInvestigationMode && this.investigationNode) {
      this.filterGraphForInvestigation(this.investigationNode);
    } else {
      this.filteredGraphData = { nodes: [...this.graphData.nodes], links: [...this.graphData.links] };
      this.calculateNodePositions();
      this.drawGraph();
    }
  }

  calculateStats(): void {
  
  this.stats = {
    totalNodes: this.graphData.nodes.length,
    totalLinks: this.graphData.links.length,
    criticalNodes: this.graphData.nodes.filter(n => n.riskCategory === 'Critical').length,
    highNodes: this.graphData.nodes.filter(n => n.riskCategory === 'High').length,
    mediumNodes: this.graphData.nodes.filter(n => n.riskCategory === 'Medium').length,
    lowNodes: this.graphData.nodes.filter(n => n.riskCategory === 'Low').length,
    fraudRings: 3,
    connectedAccounts: 12
  };
  
  // console.log('Stats calculated:', this.stats);
}

  investigateRing(ringId: string): void {
    alert(`Investigating ${ringId} - This would highlight connected nodes in the graph.`);
  }

  exportGraph(): void {
    const canvas = this.graphCanvas.nativeElement;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `fraud-graph-${new Date().toISOString().slice(0,10)}.png`;
    link.href = image;
    link.click();
  }

  viewTransactionDetails(transactionId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', transactionId]);
  }

  getNodeTypeIcon(type: string): string {
    const icons = {
      'customer': 'fas fa-user',
      'device': 'fas fa-mobile-alt',
      'account': 'fas fa-university',
      'transaction': 'fas fa-exchange-alt',
      'phone': 'fas fa-phone',
      'ip': 'fas fa-network-wired',
      'location': 'fas fa-map-marker-alt'
    };
    return icons[type as keyof typeof icons] || 'fas fa-circle';
  }

  getRiskBadgeClass(riskCategory?: string): string {
    const classes = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory as keyof typeof classes] || 'bg-secondary';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  private getNodeSize(node: GraphNode): number {
    if (node.type === 'customer') return 12 + (node.riskScore || 0) * 0.5;
    if (node.type === 'transaction') return 10;
    if (node.type === 'account') return 14;
    return 8;
  }

  public getNodeColor(node: GraphNode): string {
    if (node.riskCategory === 'Critical') return '#f72585';
    if (node.riskCategory === 'High') return '#ff9e00';
    if (node.riskCategory === 'Medium') return '#4cc9f0';
    if (node.riskCategory === 'Low') return '#06d6a0';
    if (node.flagged) return '#f72585';
    
    const typeColors: { [key: string]: string } = {
      'customer': '#4361ee',
      'device': '#4cc9f0',
      'account': '#f72585',
      'transaction': '#ff9e00',
      'phone': '#06d6a0',
      'ip': '#9c89b8',
      'location': '#ef476f'
    };
    return typeColors[node.type] || '#6c757d';
  }

  private getNodeLabel(node: GraphNode): string {
    if (node.type === 'customer') return node.name.split(' ')[0];
    if (node.type === 'transaction') return `TXN-${node.id.slice(-3)}`;
    if (node.type === 'account') return `Acc-${node.id.slice(-3)}`;
    if (node.type === 'phone') return node.name.slice(-9);
    return node.name.substring(0, 8);
  }
}