import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCopy, Check, ExternalLink, PlusCircle, ListFilter, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { CourseRecommendation } from './CourseRecommendations';
import { getAllModules, ModuleInfo } from '@/utils/moduleLookup';

interface ModuleLibraryProps {
  existingCourses: CourseRecommendation[];
  onAddRecommendation: (course: CourseRecommendation) => void;
  onCourseClick: (page: number) => void;
}

const INITIAL_COLOR = '#0ea5e9';

type FilterOption = {
  value: string;
  label: string;
};

type NormalizedModule = {
  original: ModuleInfo;
  termKey: string | null;
  typeKey: string | null;
  parts: Array<{
    areaKey: string | null;
    subcategoryKey: string | null;
    areaLabel: string | null;
    subcategoryLabel: string | null;
  }>;
};

const normalizeKey = (value?: unknown) => {
  if (value === undefined || value === null) return null;
  let asString: string;
  if (typeof value === 'string') {
    asString = value;
  } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    asString = value[0] as string;
  } else {
    asString = String(value);
  }
  const trimmed = asString.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, ' ').toLowerCase();
};

const formatLabel = (value: unknown) => {
  if (value === undefined || value === null) return '';
  const s = typeof value === 'string' ? value : String(value);
  return s.trim().replace(/\s+/g, ' ');
};

const formatTypeDisplay = (value?: string | null) => {
  if (!value) return '';
  const formatted = formatLabel(value);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const normalizeTermKey = (value?: string | null) => {
  const key = normalizeKey(value);
  if (!key) return null;

  if (key === 'ws' || key === 'ss' || key === 'both' || key === 'irregular') {
    return key;
  }

  if (key === 'ws/ss' || key === 'ss/ws' || key === 'ws + ss' || key === 'ss + ws') {
    return 'both';
  }

  return key;
};

const sortOptions = (options: FilterOption[]) =>
  [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

const ModuleLibrary = ({ existingCourses, onAddRecommendation, onCourseClick }: ModuleLibraryProps) => {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTerm, setFilterTerm] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedModule, setCopiedModule] = useState<string | null>(null);
  const [ectsOverrides, setEctsOverrides] = useState<Record<string, string>>({});
  const [editingModule, setEditingModule] = useState<ModuleInfo | null>(null);
  const [editName, setEditName] = useState('');
  const [editPage, setEditPage] = useState('');
  const [editEcts, setEditEcts] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('Loading modules...');
        const data = await getAllModules();
        console.log(`Loaded ${data.length} modules`);
        if (!cancelled) {
          setModules(data);
        }
      } catch (err) {
        console.error('Failed to load modules list', err);
        if (!cancelled) {
          setError('Failed to load modules list. Please reload the page.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedModules = useMemo<NormalizedModule[]>(() => {
    try {
      return modules.map((module) => ({
        original: module,
        termKey: normalizeTermKey(module.term),
        typeKey: normalizeKey(module.type),
        parts:
          module.partOf?.map((part) => ({
            areaKey: normalizeKey(part.area),
            subcategoryKey: normalizeKey(part.subcategory),
            areaLabel: part.area ?? null,
            subcategoryLabel: part.subcategory ?? null,
          })) ?? [],
      }));
    } catch (err) {
      console.error('Error normalizing modules:', err);
      return [];
    }
  }, [modules]);

  const filterOptions = useMemo(() => {
    const termOptions = new Map<string, string>();
    const typeOptions = new Map<string, string>();
    const areaOptions = new Map<string, string>();
    const subcategoryOptions = new Map<string, string>();
    const subcategoriesByArea = new Map<string, Map<string, string>>();

    const ensureOption = (
      map: Map<string, string>,
      key: string | null,
      label?: string | null
    ) => {
      if (!key) return null;
      const formatted = formatLabel(label ?? key);
      if (!map.has(key)) {
        map.set(key, formatted);
      }
      return key;
    };

    normalizedModules.forEach(({ original, termKey, typeKey, parts }) => {
      ensureOption(termOptions, termKey, original.term ?? termKey ?? undefined);
      ensureOption(typeOptions, typeKey, original.type ?? typeKey ?? undefined);

      parts.forEach((part) => {
        const areaKey = ensureOption(areaOptions, part.areaKey, part.areaLabel);
        const subcategoryKey = ensureOption(
          subcategoryOptions,
          part.subcategoryKey,
          part.subcategoryLabel
        );

        if (!areaKey) return;

        if (!subcategoriesByArea.has(areaKey)) {
          subcategoriesByArea.set(areaKey, new Map());
        }

        if (subcategoryKey && part.subcategoryLabel) {
          const areaSubcategories = subcategoriesByArea.get(areaKey)!;
          if (!areaSubcategories.has(subcategoryKey)) {
            areaSubcategories.set(subcategoryKey, formatLabel(part.subcategoryLabel));
          }
        }
      });
    });

    const toOptions = (map: Map<string, string>) =>
      sortOptions(Array.from(map.entries()).map(([value, label]) => ({ value, label })));

    const subcategoriesByAreaOptions = new Map<string, FilterOption[]>();
    subcategoriesByArea.forEach((subMap, areaKey) => {
      subcategoriesByAreaOptions.set(areaKey, toOptions(subMap));
    });

    return {
      terms: toOptions(termOptions),
      types: toOptions(typeOptions),
      areas: toOptions(areaOptions),
      subcategoriesByArea: subcategoriesByAreaOptions,
      subcategories: toOptions(subcategoryOptions),
    };
  }, [normalizedModules]);

  const {
    terms = [],
    types = [],
    areas = [],
    subcategoriesByArea = new Map<string, FilterOption[]>(),
    subcategories = [],
  } = filterOptions;

  const filteredModules = useMemo(() => {
    let filtered = modules;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((module) =>
        module.name.toLowerCase().includes(query)
      );
    }

    if (filterTerm !== 'all') {
      filtered = filtered.filter((module) => {
        const normalizedTerm = normalizeTermKey(module.term);
        return normalizedTerm === filterTerm;
      });
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((module) => {
        const normalizedType = normalizeKey(module.type);
        return normalizedType === filterType;
      });
    }

    if (filterArea !== 'all') {
      filtered = filtered.filter((module) =>
        module.partOf?.some((part) => {
          const normalizedArea = normalizeKey(part.area);
          return normalizedArea === filterArea;
        })
      );
    }

    if (filterSubcategory !== 'all') {
      filtered = filtered.filter((module) =>
        module.partOf?.some((part) => {
          const normalizedSubcategory = normalizeKey(part.subcategory);
          const matchesArea = filterArea === 'all' || normalizeKey(part.area) === filterArea;
          return matchesArea && normalizedSubcategory === filterSubcategory;
        })
      );
    }

    return filtered;
  }, [modules, searchQuery, filterTerm, filterType, filterArea, filterSubcategory]);

  useEffect(() => {
    if (filterArea === 'all') {
      if (filterSubcategory !== 'all') {
        setFilterSubcategory('all');
      }
      return;
    }

    const areaSubcategories = subcategoriesByArea.get(filterArea);
    if (
      filterSubcategory !== 'all' &&
      (!areaSubcategories || !areaSubcategories.some((option) => option.value === filterSubcategory))
    ) {
      setFilterSubcategory('all');
    }
  }, [filterArea, filterSubcategory, subcategoriesByArea]);

  const availableSubcategories = useMemo(() => {
    if (filterArea === 'all') {
      return subcategories;
    }
    const specific = subcategoriesByArea.get(filterArea);
    return specific ?? [];
  }, [filterArea, subcategories, subcategoriesByArea]);

  const handleAddRecommendation = (module: ModuleInfo) => {
    if (existingCourses.some((course) => course.name === module.name)) {
      toast.info(`"${module.name}" is already in your recommendations.`);
      return;
    }

    const override = ectsOverrides[module.name];
    const ectsValueRaw = override !== undefined
      ? parseFloat(override)
      : module.ects ?? undefined;
    const ectsValue = typeof ectsValueRaw === 'number' && !Number.isNaN(ectsValueRaw)
      ? ectsValueRaw
      : undefined;
    const course: CourseRecommendation = {
      id: `module-${module.name}`,
      name: module.name,
      page: module.page,
      ects: ectsValue,
      credits: ectsValue !== undefined ? `${ectsValue} ECTS` : undefined,
      color: INITIAL_COLOR,
      semester: undefined,
    };

    onAddRecommendation(course);
    toast.success(`Added "${module.name}" to recommendations.`);
  };

  const handleCopyJson = async (module: ModuleInfo) => {
    try {
      const override = ectsOverrides[module.name];
      const ectsValueRaw = override !== undefined
        ? parseFloat(override)
        : module.ects ?? undefined;
      const ectsValue = typeof ectsValueRaw === 'number' && !Number.isNaN(ectsValueRaw)
        ? ectsValueRaw
        : null;
      const payload = {
        name: module.name,
        ects: ectsValue,
        page: module.page,
        term: module.term ?? null,
        type: module.type ?? null,
        partOf: module.partOf ?? null,
      };

      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedModule(module.name);
      toast.success('Module JSON copied to clipboard.');
      setTimeout(() => setCopiedModule(null), 1500);
    } catch (err) {
      console.error('Failed to copy JSON', err);
      toast.error('Failed to copy JSON to clipboard.');
    }
  };

  const handleChangeEcts = (moduleName: string, value: string) => {
    setEctsOverrides((prev) => ({ ...prev, [moduleName]: value }));
  };

  const handleOpenEditDialog = (module: ModuleInfo) => {
    setEditingModule(module);
    setEditName(module.name);
    setEditPage(module.page.toString());
    setEditEcts(module.ects?.toString() || '');
  };

  const handleSaveEdit = () => {
    if (!editingModule) return;

    const pageNum = parseInt(editPage, 10);
    const ectsNum = editEcts ? parseFloat(editEcts) : null;

    if (!editName.trim()) {
      toast.error('Module name cannot be empty');
      return;
    }

    if (isNaN(pageNum) || pageNum < 1) {
      toast.error('Page number must be a positive integer');
      return;
    }

    setModules((prev) =>
      prev.map((m) =>
        m.name === editingModule.name
          ? {
              ...m,
              name: editName.trim(),
              page: pageNum,
              ects: ectsNum !== null && !isNaN(ectsNum) ? ectsNum : null,
            }
          : m
      )
    );

    // Update ECTS override if it exists
    if (ectsNum !== null && !isNaN(ectsNum)) {
      setEctsOverrides((prev) => ({
        ...prev,
        [editName.trim()]: ectsNum.toString(),
      }));
    }

    toast.success('Module updated successfully');
    setEditingModule(null);
  };

  if (loading) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Loading module list...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-destructive">
        {error}
      </Card>
    );
  }

  try {
    return (
      <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold flex items-center gap-2">
          Module Library
          <Badge variant="outline">{modules.length}</Badge>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Search and add official modules directly. Optionally set ECTS before copying or adding.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search modules by name..."
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.value === 'ws' && 'Winter Semester (WS)'}
                    {term.value === 'ss' && 'Summer Semester (SS)'}
                    {term.value === 'both' && 'Both Semesters'}
                    {term.value !== 'ws' && term.value !== 'ss' && term.value !== 'both' && term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label.charAt(0).toUpperCase() + type.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by specialization area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.value} value={subcategory.value}>
                    {subcategory.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-module-name">Module Name</Label>
              <Input
                id="edit-module-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Machine Learning"
              />
            </div>

            <div>
              <Label htmlFor="edit-module-page">Page Number</Label>
              <Input
                id="edit-module-page"
                type="number"
                value={editPage}
                onChange={(e) => setEditPage(e.target.value)}
                placeholder="e.g., 236"
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The actual page in the PDF where this module appears
              </p>
            </div>

            <div>
              <Label htmlFor="edit-module-ects">ECTS Points</Label>
              <Input
                id="edit-module-ects"
                type="number"
                value={editEcts}
                onChange={(e) => setEditEcts(e.target.value)}
                placeholder="e.g., 5"
                step="0.5"
                min="0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingModule(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredModules.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No modules found for "{searchQuery}".
        </Card>
      ) : (
        <ScrollArea className="h-[70vh] pr-4">
          <div className="grid gap-3 md:grid-cols-2">
            {filteredModules.map((module) => {
              const override = ectsOverrides[module.name];
              const defaultEcts = module.ects ?? null;
              const inputValue = override ?? (defaultEcts !== null && defaultEcts !== undefined ? String(defaultEcts) : '');
              const hasEcts = inputValue.trim().length > 0;
              const isAlreadyAdded = existingCourses.some((course) => course.name === module.name);

              return (
                <Card key={module.name} className="p-4 space-y-4 border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-foreground">{module.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">Page {module.page}</Badge>
                        {hasEcts && (
                          <Badge variant="outline">
                            ECTS: {override !== undefined ? override : module.ects}
                          </Badge>
                        )}
                        {module.term && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {module.term}
                          </Badge>
                        )}
                        {module.type && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {formatTypeDisplay(module.type)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(module)}
                        title="Edit module details"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCourseClick(module.page)}
                        title="Open module in handbook"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor={`ects-${module.page}`}>
                      ECTS (optional)
                    </label>
                    <Input
                      id={`ects-${module.page}`}
                      value={inputValue}
                      placeholder="e.g., 6"
                      onChange={(event) => handleChangeEcts(module.name, event.target.value)}
                      inputMode="decimal"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => handleAddRecommendation(module)}
                      variant={isAlreadyAdded ? 'outline' : 'default'}
                      className="flex items-center gap-2"
                      disabled={isAlreadyAdded}
                    >
                      <PlusCircle className="h-4 w-4" />
                      {isAlreadyAdded ? 'Already added' : 'Add to recommendations'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleCopyJson(module)}
                    >
                      {copiedModule === module.name ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ClipboardCopy className="h-4 w-4" />
                      )}
                      Copy JSON
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
      </div>
    );
  } catch (err) {
    console.error('ModuleLibrary render error:', err);
    return (
      <Card className="p-6 text-center text-destructive">
        Failed to render modules: {err instanceof Error ? err.message : String(err)}
      </Card>
    );
  }
};

export default ModuleLibrary;

