export interface ModuleInfo {
  name: string;
  page: number; // actual PDF page number for viewer
  listedPage?: number; // page number from handbook index (for reference)
  ects?: number | null;
  term?: string; // WS, SS, Both
  type?: string; // lecture, seminar, practical
  partOf?: Array<{
    type: string;
    area?: string;
    subcategory?: string;
  }>;
  schedule?: {
    times?: string[];
    rooms?: string[];
    instructors?: string[];
    source_page?: number;
  };
  exam?: {
    type?: string;
    date?: string;
    day_of_week?: string;
  };
}

type ModuleMetadataFile = 
  | Array<{
      name: string;
      page?: number;
      listedPage?: number;
      actualPage?: number | null;
      ects?: number | null;
      term?: string;
      type?: string;
      partOf?: Array<{
        type: string;
        area?: string;
        subcategory?: string;
      }>;
      schedule?: {
        times?: string[];
        rooms?: string[];
        instructors?: string[];
        source_page?: number;
      };
      exam?: {
        type?: string;
        date?: string;
        day_of_week?: string;
      };
    }>
  | {
      generatedAt?: string;
      modules: Array<{
        name: string;
        page?: number;
        listedPage?: number;
        actualPage?: number | null;
        ects?: number | null;
        term?: string;
        type?: string;
        partOf?: Array<{
          type: string;
          area?: string;
          subcategory?: string;
        }>;
        schedule?: {
          times?: string[];
          rooms?: string[];
          instructors?: string[];
          source_page?: number;
        };
        exam?: {
          type?: string;
          date?: string;
          day_of_week?: string;
        };
      }>;
    };

let moduleData: ModuleInfo[] | null = null;

async function loadModulesData(forceReload = false): Promise<ModuleInfo[]> {
  if (moduleData && !forceReload) return moduleData;

  try {
    const response = await fetch('/modules_metadata.json');
    if (!response.ok) {
      throw new Error(`Failed to load modules_metadata.json (${response.status})`);
    }

    const metadata: ModuleMetadataFile = await response.json();
    // Handle both array and object formats
    const modulesArray = Array.isArray(metadata) ? metadata : metadata.modules;
    
    moduleData = modulesArray
      .filter((entry) => Boolean(entry.name))
      .map((entry) => ({
        name: entry.name.trim(),
        page: entry.page && entry.page > 0 ? entry.page : (entry.actualPage && entry.actualPage > 0 ? entry.actualPage : (entry.listedPage ?? 1)),
        listedPage: entry.listedPage,
        ects: entry.ects ?? null,
        term: entry.term,
        type: entry.type,
        partOf: entry.partOf,
        schedule: entry.schedule,
        exam: entry.exam,
      }));

    return moduleData;
  } catch (err) {
    console.error('Error loading module metadata:', err);
    moduleData = [];
    return [];
  }
}

export async function getAllCourseNames(): Promise<string[]> {
  const modules = await loadModulesData();
  return modules.map((m) => m.name);
}

export async function findCoursePage(courseName: string): Promise<number | null> {
  const modules = await loadModulesData();
  if (!courseName) return null;

  const normalized = courseName.toLowerCase().trim();
  const exact = modules.find((m) => m.name.toLowerCase() === normalized);
  if (exact) return exact.page;

  const partial = modules.find((m) => {
    const nameLower = m.name.toLowerCase();
    return nameLower.includes(normalized) || normalized.includes(nameLower);
  });
  if (partial) return partial.page;

  const words = normalized.split(/\s+/);
  const matching = modules.find((m) => {
    const moduleWords = m.name.toLowerCase().split(/\s+/);
    return words.some((word) => moduleWords.some((mw) => mw.startsWith(word) || word.startsWith(mw)));
  });
  return matching ? matching.page : null;
}

export async function getModuleByName(courseName: string): Promise<ModuleInfo | null> {
  const modules = await loadModulesData();
  if (!courseName) return null;

  const normalized = courseName.toLowerCase().trim();
  return (
    modules.find((m) => m.name.toLowerCase() === normalized) ??
    modules.find((m) => m.name.toLowerCase().includes(normalized) || normalized.includes(m.name.toLowerCase())) ??
    null
  );
}

export async function getAllModules(): Promise<ModuleInfo[]> {
  return loadModulesData();
}

export async function searchModules(query: string): Promise<ModuleInfo[]> {
  const modules = await loadModulesData();
  if (!query) return modules;
  const q = query.toLowerCase();
  return modules.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 50);
}
