import type { Project, Expense, UserRole, VisibilityType } from '../types';

const API_BASE = 'http://localhost:8080/api/v1';

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('golgeden_token');
  }

  private static getHeaders(activeRole: UserRole): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Demo-Role': activeRole,
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async getProjects(activeRole: UserRole = 'contractor'): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: this.getHeaders(activeRole),
      });
      if (!res.ok) throw new Error('Backend fetch projects failed');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return this.getAllMockProjects(activeRole);
    } catch (err) {
      console.warn('Backend unavailable, using local mock projects list', err);
      return this.getAllMockProjects(activeRole);
    }
  }

  static async seedDemoProject(activeRole: UserRole = 'contractor'): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE}/projects/demo-project-zumrut-kule/seed`, {
        method: 'POST',
        headers: this.getHeaders(activeRole),
      });
      if (!res.ok) throw new Error('Backend seed failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, using local demo state', err);
      return this.getLocalMockProject(activeRole);
    }
  }

  static async getProject(id: string, activeRole: UserRole): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        headers: this.getHeaders(activeRole),
      });
      if (!res.ok) throw new Error('Fetch project failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend getProject failed, searching local mock projects', err);
      const all = this.getAllMockProjects(activeRole);
      const found = all.find((p) => p.id === id);
      return found || all[0];
    }
  }

  static async updateVisibility(
    projectID: string,
    visibility: VisibilityType,
    showFinancialsToClients: boolean,
    activeRole: UserRole
  ): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectID}/visibility`, {
        method: 'PATCH',
        headers: this.getHeaders(activeRole),
        body: JSON.stringify({ visibility, show_financials_to_clients: showFinancialsToClients }),
      });
      if (!res.ok) throw new Error('Update visibility failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend update failed, updating local mock project', err);
      const proj = await this.getProject(projectID, activeRole);
      proj.visibility = visibility;
      proj.show_financials_to_clients = showFinancialsToClients;
      return proj;
    }
  }

  static async updateStage(
    stageID: string,
    isCompleted?: boolean,
    actualCost?: number
  ): Promise<void> {
    try {
      await fetch(`${API_BASE}/stages/${stageID}`, {
        method: 'PATCH',
        headers: this.getHeaders('contractor'),
        body: JSON.stringify({ is_completed: isCompleted, actual_cost: actualCost }),
      });
    } catch (err) {
      console.warn('Backend stage update failed', err);
    }
  }

  static async createExpense(
    projectID: string,
    expenseData: Partial<Expense>
  ): Promise<Expense> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectID}/expenses`, {
        method: 'POST',
        headers: this.getHeaders('contractor'),
        body: JSON.stringify(expenseData),
      });
      if (!res.ok) throw new Error('Create expense failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend expense creation failed', err);
      return {
        id: 'exp-local-' + Date.now(),
        project_id: projectID,
        category: expenseData.category || 'material',
        amount: expenseData.amount || 0,
        invoice_url: expenseData.invoice_url || '',
        notes: expenseData.notes || '',
        date: expenseData.date || new Date().toISOString().split('T')[0],
      };
    }
  }

  // Multi-project Mock Database
  static getAllMockProjects(activeRole: UserRole): Project[] {
    return [
      this.getLocalMockProject(activeRole),
      this.getSafirVillalariMockProject(activeRole),
      this.getKehribarKonaklariMockProject(activeRole),
    ];
  }

  // 1. Zümrüt Kule Rezidans
  static getLocalMockProject(activeRole: UserRole): Project {
    const showFinancials = true;
    const isClientHidden = activeRole === 'client' && !showFinancials;

    return {
      id: 'demo-project-zumrut-kule',
      contractor_id: 'c-demo-1',
      name: 'Zümrüt Kule Rezidans',
      location: 'Pendik / İstanbul',
      description: '5 Katlı 10 Daireli Lüks Konut & Şehir Manzaralı Rezidans Projesi',
      status: 'active',
      unit_count: 10,
      total_budget: isClientHidden ? 0 : 15000000,
      visibility: 'public',
      show_financials_to_clients: true,
      physical_progress: 58.5,
      financial_progress: isClientHidden ? 0 : 37.1,
      total_actual_cost: isClientHidden ? 0 : 5570000,
      cost_variance: isClientHidden ? 0 : 9430000,
      stages: [
        {
          id: 's-1',
          project_id: 'demo-project-zumrut-kule',
          name: 'Hafriyat ve Temel Kazısı',
          category: 'official',
          estimated_cost: isClientHidden ? 0 : 1500000,
          actual_cost: isClientHidden ? 0 : 1420000,
          weight_percentage: 15,
          is_completed: true,
          order_index: 1,
        },
        {
          id: 's-2',
          project_id: 'demo-project-zumrut-kule',
          name: 'Temel Radye Beton ve Yalıtım',
          category: 'material',
          estimated_cost: isClientHidden ? 0 : 2000000,
          actual_cost: isClientHidden ? 0 : 1980000,
          weight_percentage: 20,
          is_completed: true,
          order_index: 2,
        },
      ],
      floors: [
        {
          id: 'floor-5',
          project_id: 'demo-project-zumrut-kule',
          floor_number: 5,
          name: '5. Kat (Çatı Katı)',
          is_completed: false,
          stages: [
            {
              id: 'stage-floor-5',
              project_id: 'demo-project-zumrut-kule',
              floor_id: 'floor-5',
              name: '5. Kat Kolon & Betonarme',
              category: 'labor',
              estimated_cost: isClientHidden ? 0 : 1200000,
              actual_cost: 0,
              weight_percentage: 8,
              is_completed: false,
              order_index: 5,
            },
          ],
          units: [
            { id: 'unit-501', floor_id: 'floor-5', unit_number: 501, name: 'Daire 501 (Penthouse)', is_completed: false },
            { id: 'unit-502', floor_id: 'floor-5', unit_number: 502, name: 'Daire 502 (Penthouse)', is_completed: false },
          ],
        },
        {
          id: 'floor-4',
          project_id: 'demo-project-zumrut-kule',
          floor_number: 4,
          name: '4. Kat',
          is_completed: false,
          stages: [
            {
              id: 'stage-floor-4',
              project_id: 'demo-project-zumrut-kule',
              floor_id: 'floor-4',
              name: '4. Kat Kolon & Betonarme',
              category: 'labor',
              estimated_cost: isClientHidden ? 0 : 1200000,
              actual_cost: 0,
              weight_percentage: 8,
              is_completed: false,
              order_index: 4,
            },
          ],
          units: [
            { id: 'unit-401', floor_id: 'floor-4', unit_number: 401, name: 'Daire 401 (3+1 Lüks)', is_completed: false },
            { id: 'unit-402', floor_id: 'floor-4', unit_number: 402, name: 'Daire 402 (3+1 Lüks)', is_completed: false },
          ],
        },
        {
          id: 'floor-3',
          project_id: 'demo-project-zumrut-kule',
          floor_number: 3,
          name: '3. Kat',
          is_completed: false,
          stages: [
            {
              id: 'stage-floor-3',
              project_id: 'demo-project-zumrut-kule',
              floor_id: 'floor-3',
              name: '3. Kat Kolon & Betonarme',
              category: 'labor',
              estimated_cost: isClientHidden ? 0 : 1200000,
              actual_cost: isClientHidden ? 0 : 1150000,
              weight_percentage: 8,
              is_completed: true,
              order_index: 3,
            },
          ],
          units: [
            { id: 'unit-301', floor_id: 'floor-3', unit_number: 301, name: 'Daire 301 (3+1 Lüks)', is_completed: true },
            { id: 'unit-302', floor_id: 'floor-3', unit_number: 302, name: 'Daire 302 (3+1 Lüks)', is_completed: false },
          ],
        },
        {
          id: 'floor-2',
          project_id: 'demo-project-zumrut-kule',
          floor_number: 2,
          name: '2. Kat',
          is_completed: true,
          stages: [
            {
              id: 'stage-floor-2',
              project_id: 'demo-project-zumrut-kule',
              floor_id: 'floor-2',
              name: '2. Kat Kolon & Betonarme',
              category: 'labor',
              estimated_cost: isClientHidden ? 0 : 1200000,
              actual_cost: isClientHidden ? 0 : 1150000,
              weight_percentage: 8,
              is_completed: true,
              order_index: 2,
            },
          ],
          units: [
            { id: 'unit-201', floor_id: 'floor-2', unit_number: 201, name: 'Daire 201 (3+1 Lüks)', is_completed: true },
            { id: 'unit-202', floor_id: 'floor-2', unit_number: 202, name: 'Daire 202 (3+1 Lüks)', is_completed: true },
          ],
        },
        {
          id: 'floor-1',
          project_id: 'demo-project-zumrut-kule',
          floor_number: 1,
          name: '1. Kat (Giriş Üstü)',
          is_completed: true,
          stages: [
            {
              id: 'stage-floor-1',
              project_id: 'demo-project-zumrut-kule',
              floor_id: 'floor-1',
              name: '1. Kat Kolon & Betonarme',
              category: 'labor',
              estimated_cost: isClientHidden ? 0 : 1200000,
              actual_cost: isClientHidden ? 0 : 1150000,
              weight_percentage: 8,
              is_completed: true,
              order_index: 1,
            },
          ],
          units: [
            { id: 'unit-101', floor_id: 'floor-1', unit_number: 101, name: 'Daire 101 (3+1 Lüks)', is_completed: true },
            { id: 'unit-102', floor_id: 'floor-1', unit_number: 102, name: 'Daire 102 (3+1 Lüks)', is_completed: true },
          ],
        },
      ],
      expenses: isClientHidden
        ? []
        : [
            { id: 'exp-1', project_id: 'demo-project-zumrut-kule', category: 'material', amount: 1420000, notes: 'C35 Hazır Beton & Demir Alımı', invoice_url: 'https://example.com/invoice-001.pdf', date: '2026-06-15' },
            { id: 'exp-2', project_id: 'demo-project-zumrut-kule', category: 'material', amount: 1980000, notes: 'Su ve Isı Yalıtım Malzemeleri', invoice_url: 'https://example.com/invoice-002.pdf', date: '2026-07-01' },
            { id: 'exp-3', project_id: 'demo-project-zumrut-kule', category: 'labor', amount: 850000, notes: 'Kalıp ve Taşeron İşçilik Ödemesi', invoice_url: 'https://example.com/invoice-003.pdf', date: '2026-07-20' },
            { id: 'exp-4', project_id: 'demo-project-zumrut-kule', category: 'official', amount: 320000, notes: 'Belediye Yapı Denetim Harçları', invoice_url: 'https://example.com/invoice-004.pdf', date: '2026-08-05' },
            { id: 'exp-5', project_id: 'demo-project-zumrut-kule', category: 'subcontractor', amount: 1000000, notes: 'Elektrik & Sıhhi Tesisat Avansı', invoice_url: 'https://example.com/invoice-005.pdf', date: '2026-08-12' },
          ],
    };
  }

  // 2. Safir Villaları Projesi
  static getSafirVillalariMockProject(activeRole: UserRole): Project {
    const showFinancials = false; // protected financials demo
    const isClientHidden = activeRole === 'client' && !showFinancials;

    return {
      id: 'demo-project-safir-villalari',
      contractor_id: 'c-demo-1',
      name: 'Safir Villaları Projesi',
      location: 'Şile / İstanbul',
      description: '3 Katlı Müstakil 6 Adet Akıllı Lüks Villa ve Peyzaj Yerleşkesi',
      status: 'active',
      unit_count: 6,
      total_budget: isClientHidden ? 0 : 28000000,
      visibility: 'protected',
      show_financials_to_clients: false,
      physical_progress: 82.0,
      financial_progress: isClientHidden ? 0 : 75.4,
      total_actual_cost: isClientHidden ? 0 : 21112000,
      cost_variance: isClientHidden ? 0 : 6888000,
      stages: [
        {
          id: 'safir-s-1',
          project_id: 'demo-project-safir-villalari',
          name: 'Peyzaj Kazı & Havuz Altyapısı',
          category: 'official',
          estimated_cost: isClientHidden ? 0 : 4000000,
          actual_cost: isClientHidden ? 0 : 3950000,
          weight_percentage: 25,
          is_completed: true,
          order_index: 1,
        },
        {
          id: 'safir-s-2',
          project_id: 'demo-project-safir-villalari',
          name: 'Ahşap & Çelik Karkas İmalatı',
          category: 'material',
          estimated_cost: isClientHidden ? 0 : 12000000,
          actual_cost: isClientHidden ? 0 : 11800000,
          weight_percentage: 45,
          is_completed: true,
          order_index: 2,
        },
      ],
      floors: [
        {
          id: 'safir-f-3',
          project_id: 'demo-project-safir-villalari',
          floor_number: 3,
          name: 'Çatı & Teras Katı',
          is_completed: true,
          stages: [
            {
              id: 'st-safir-f-3',
              project_id: 'demo-project-safir-villalari',
              floor_id: 'safir-f-3',
              name: 'Güneş Paneli & Çatı İzolasyon',
              category: 'subcontractor',
              estimated_cost: isClientHidden ? 0 : 3000000,
              actual_cost: isClientHidden ? 0 : 2900000,
              weight_percentage: 10,
              is_completed: true,
              order_index: 1,
            },
          ],
          units: [
            { id: 'safir-u-301', floor_id: 'safir-f-3', unit_number: 301, name: 'Villa Safir-A Teras Suite', is_completed: true },
            { id: 'safir-u-302', floor_id: 'safir-f-3', unit_number: 302, name: 'Villa Safir-B Teras Suite', is_completed: true },
          ],
        },
        {
          id: 'safir-f-2',
          project_id: 'demo-project-safir-villalari',
          floor_number: 2,
          name: 'Üst Kat (Yatak Odaları)',
          is_completed: true,
          units: [
            { id: 'safir-u-201', floor_id: 'safir-f-2', unit_number: 201, name: 'Villa Safir-A Üst Kat', is_completed: true },
            { id: 'safir-u-202', floor_id: 'safir-f-2', unit_number: 202, name: 'Villa Safir-B Üst Kat', is_completed: true },
          ],
        },
        {
          id: 'safir-f-1',
          project_id: 'demo-project-safir-villalari',
          floor_number: 1,
          name: 'Bahçe Katı & Salon',
          is_completed: true,
          units: [
            { id: 'safir-u-101', floor_id: 'safir-f-1', unit_number: 101, name: 'Villa Safir-A Bahçe Katı', is_completed: true },
            { id: 'safir-u-102', floor_id: 'safir-f-1', unit_number: 102, name: 'Villa Safir-B Bahçe Katı', is_completed: true },
          ],
        },
      ],
      expenses: isClientHidden
        ? []
        : [
            { id: 'exp-safir-1', project_id: 'demo-project-safir-villalari', category: 'material', amount: 11800000, notes: 'Özel Ahşap ve Çelik Konstrüksiyon', invoice_url: 'https://example.com/invoice-safir-01.pdf', date: '2026-05-10' },
            { id: 'exp-safir-2', project_id: 'demo-project-safir-villalari', category: 'subcontractor', amount: 9312000, notes: 'Akıllı Ev Altyapısı & Havuz Tesisatı', invoice_url: 'https://example.com/invoice-safir-02.pdf', date: '2026-07-15' },
          ],
    };
  }

  // 3. Kehribar Konakları & İş Merkezi
  static getKehribarKonaklariMockProject(activeRole: UserRole): Project {
    const showFinancials = true;
    const isClientHidden = activeRole === 'client' && !showFinancials;

    return {
      id: 'demo-project-kehribar-konaklari',
      contractor_id: 'c-demo-1',
      name: 'Kehribar Konakları & İş Merkezi',
      location: 'Kadıköy / İstanbul',
      description: '4 Katlı Karma Kullanımlı Ofis, Çarşı ve Ticari İş Merkezi',
      status: 'planning',
      unit_count: 8,
      total_budget: isClientHidden ? 0 : 42000000,
      visibility: 'public',
      show_financials_to_clients: true,
      physical_progress: 24.0,
      financial_progress: isClientHidden ? 0 : 18.5,
      total_actual_cost: isClientHidden ? 0 : 7770000,
      cost_variance: isClientHidden ? 0 : 34230000,
      stages: [
        {
          id: 'keh-s-1',
          project_id: 'demo-project-kehribar-konaklari',
          name: 'Zemin İkza ve İksa Kazık İşleri',
          category: 'official',
          estimated_cost: isClientHidden ? 0 : 8000000,
          actual_cost: isClientHidden ? 0 : 7770000,
          weight_percentage: 20,
          is_completed: true,
          order_index: 1,
        },
        {
          id: 'keh-s-2',
          project_id: 'demo-project-kehribar-konaklari',
          name: 'Bodrum Kat Şerbetli Beton',
          category: 'material',
          estimated_cost: isClientHidden ? 0 : 10000000,
          actual_cost: 0,
          weight_percentage: 25,
          is_completed: false,
          order_index: 2,
        },
      ],
      floors: [
        {
          id: 'keh-f-4',
          project_id: 'demo-project-kehribar-konaklari',
          floor_number: 4,
          name: '4. Kat Executive Ofisler',
          is_completed: false,
          units: [
            { id: 'keh-u-401', floor_id: 'keh-f-4', unit_number: 401, name: 'Ofis 401 (Plaza)', is_completed: false },
            { id: 'keh-u-402', floor_id: 'keh-f-4', unit_number: 402, name: 'Ofis 402 (Plaza)', is_completed: false },
          ],
        },
        {
          id: 'keh-f-3',
          project_id: 'demo-project-kehribar-konaklari',
          floor_number: 3,
          name: '3. Kat Plaza Ofisleri',
          is_completed: false,
          units: [
            { id: 'keh-u-301', floor_id: 'keh-f-3', unit_number: 301, name: 'Ofis 301', is_completed: false },
            { id: 'keh-u-302', floor_id: 'keh-f-3', unit_number: 302, name: 'Ofis 302', is_completed: false },
          ],
        },
        {
          id: 'keh-f-2',
          project_id: 'demo-project-kehribar-konaklari',
          floor_number: 2,
          name: '2. Kat Ticari Mağazalar',
          is_completed: false,
          units: [
            { id: 'keh-u-201', floor_id: 'keh-f-2', unit_number: 201, name: 'Dükkan 201', is_completed: false },
            { id: 'keh-u-202', floor_id: 'keh-f-2', unit_number: 202, name: 'Dükkan 202', is_completed: false },
          ],
        },
        {
          id: 'keh-f-1',
          project_id: 'demo-project-kehribar-konaklari',
          floor_number: 1,
          name: 'Zemin Kat Çarşı & Cadde Dükkanları',
          is_completed: false,
          units: [
            { id: 'keh-u-101', floor_id: 'keh-f-1', unit_number: 101, name: 'Cadde Mağaza 101', is_completed: false },
            { id: 'keh-u-102', floor_id: 'keh-f-1', unit_number: 102, name: 'Cadde Mağaza 102', is_completed: false },
          ],
        },
      ],
      expenses: isClientHidden
        ? []
        : [
            { id: 'exp-keh-1', project_id: 'demo-project-kehribar-konaklari', category: 'official', amount: 7770000, notes: 'Kadıköy Belediye Proje Ruhsatı & İksa Harcı', invoice_url: 'https://example.com/invoice-keh-01.pdf', date: '2026-08-01' },
          ],
    };
  }
}
