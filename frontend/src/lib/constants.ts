export const LANGUAGES = [
  "c",
  "cpp",
  "java",
  "python",
  "javascript",
  "typescript",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "other",
];

export const COMMAND_CATEGORIES = [
  { id: "linux", label: "Linux" },
  { id: "windows_cmd", label: "Windows CMD" },
  { id: "powershell", label: "PowerShell" },
  { id: "git", label: "Git" },
  { id: "networking", label: "Networking" },
  { id: "python", label: "Python" },
  { id: "nodejs", label: "Node.js" },
  { id: "dev_tools", label: "Development tools" },
];

export const DB_TYPES = [
  { id: "mysql", label: "MySQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "sqlite", label: "SQLite" },
  { id: "sql", label: "Standard SQL" },
];

export const EXAM_KINDS = [
  { id: "important", label: "Important question" },
  { id: "short", label: "Short answer" },
  { id: "long", label: "Long answer" },
  { id: "viva", label: "Practical viva" },
  { id: "definition", label: "Definition" },
  { id: "notes", label: "Revision notes" },
];

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export const ROUTE_BY_TYPE: Record<string, string> = {
  material: "/materials",
  website: "/websites",
  note: "/notes",
  assignment: "/assignments",
  snippet: "/snippets",
  sql: "/sql",
  command: "/commands",
  exam: "/exam",
};
