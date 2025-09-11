import { Router, Request, Response } from 'express';
import multer, { diskStorage } from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const DOCS_DIR = path.join(DATA_DIR, 'docs');
const INDEX_FILE = path.join(DOCS_DIR, 'index.json');

type Visibility = 'public' | 'private';
type DocItem = {
  id: string;
  therapistId: string;
  clientId?: string; // present when private to a client
  visibility: Visibility;
  title: string;
  filename?: string; // local file path
  url?: string; // external resource
  originalname?: string;
  createdAt: number;
};

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_FILE)) fs.writeFileSync(INDEX_FILE, JSON.stringify([], null, 2));
}

function readIndex(): DocItem[] {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeIndex(items: DocItem[]) {
  ensure();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function seedDefaults() {
  ensure();
  const current = readIndex();
  if (current.length > 0) return;
  const now = Date.now();
  const seeded: DocItem[] = [
    {
      id: 'res-1',
      therapistId: 'system',
      visibility: 'public',
      title: 'Managing Anxiety: A CBT Guide (NHS)',
      url: 'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/anxiety-self-help/',
      createdAt: now,
    },
    {
      id: 'res-2',
      therapistId: 'system',
      visibility: 'public',
      title: 'Depression: Self-Help & Support (NICE)',
      url: 'https://www.nice.org.uk/guidance/cg90/ifp/chapter/Information-for-the-public',
      createdAt: now + 1,
    },
  ];
  writeIndex(seeded);
}

const storage = diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    ensure();
    cb(null, DOCS_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}-${safe}`);
  },
});

const upload = multer({ storage });

// Therapist uploads a document (private to a client or public to everyone)
router.post('/upload', authenticateToken, upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    if (user.role !== 'therapist') {
      res.status(403).json({ message: 'Only therapists can upload' });
      return;
    }
    const { clientId, title, visibility, url } = req.body as { clientId?: string; title?: string; visibility?: Visibility; url?: string };
    const vis: Visibility = visibility === 'public' ? 'public' : 'private';
    if (vis === 'private' && !clientId) {
      res.status(400).json({ message: 'clientId is required for private docs' });
      return;
    }
    if (!req.file && !url) {
      res.status(400).json({ message: 'Provide a file or an url' });
      return;
    }

    const items = readIndex();
    const item: DocItem = {
      id: Math.random().toString(36).slice(2, 10),
      therapistId: user.id,
      clientId: vis === 'private' ? clientId : undefined,
      visibility: vis,
      title: title || (req.file?.originalname || url || 'Document'),
      filename: req.file?.filename,
      url: url,
      originalname: req.file?.originalname,
      createdAt: Date.now(),
    };
    items.push(item);
    writeIndex(items);
    res.json(item);
    return;
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'upload failed' });
    return;
  }
});

// List documents for current user (client sees their docs; therapist sees their uploads)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  seedDefaults();
  const user = req.user!;
  const items = readIndex();
  let myItems: DocItem[];
  if (user.role === 'client') {
    myItems = items.filter((i) => i.visibility === 'public' || i.clientId === user.id);
  } else if (user.role === 'therapist') {
    myItems = items.filter((i) => i.therapistId === user.id);
  } else {
    myItems = [];
  }
  res.json(myItems);
  return;
});

// Download document by id
router.get('/:id/download', optionalAuthenticateToken, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const items = readIndex();
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const canAccess =
    item.visibility === 'public' ||
    (user && user.role === 'therapist' && user.id === item.therapistId) ||
    (user && user.role === 'client' && !!item.clientId && user.id === item.clientId);
  if (!canAccess) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  if (item.url) {
    res.redirect(item.url);
    return;
  }
  const filename = item.filename;
  if (!filename) {
    res.status(404).json({ message: 'File missing' });
    return;
  }
  const filepath = path.join(DOCS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    res.status(404).json({ message: 'File missing' });
    return;
  }
  res.download(filepath, item.originalname ?? filename);
  return;
});

export default router;


