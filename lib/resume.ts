// The résumé page, in the PDF's order: Education, Skills, Work Experience, Project
// Experience, Activities (the archive follows, from lib/site.ts).
//
// Two layers:
// - `bullets`, `coursework`, `line` and the Skills rows on PDF entries are the PDF
//   word for word (public/assets/devashish-juyal-resume.pdf); tests/resume.test.ts
//   checks them against a copy of its text. Edit them only together with the PDF.
// - `more` is extra detail, taken only from written sources: the project repos'
//   READMEs and the site's own pages. Never a figure that contradicts the PDF.
// Entries not on the PDF (`fromPdf: false`) are described in full or left off.
// No phone number anywhere on the page.

export type Link = { label: string; href: string };
export type More = { lead?: string; points: string[] };

export type School = { id: string; org: string; place: string; line: string; dates: string; coursework: string };
export type Job = { id: string; org: string; place: string; role: string; dates: string; bullets: string[]; more?: More };
export type ResumeProject = {
  id: string; name: string; fromPdf: boolean; links: Link[];
  /** /projects anchor, when the project is on that page too */
  project?: string;
  bullets: string[]; more?: More;
};

export const contact = {
  email: 'djuyal23@gmail.com',
  linkedin: { label: 'linkedin.com/in/devashish-juyal', href: 'https://linkedin.com/in/devashish-juyal' },
};

export const education: School[] = [
  {
    id: 'um-ms', org: 'University of Michigan', place: 'Ann Arbor, MI',
    line: 'MS in Electrical and Computer Engineering | GPA: 3.52/4', dates: 'May 2026',
    coursework: 'Small Language Models (SLM), Natural Language Processing (NLP), Large Language Models (LLM), SQL, ML',
  },
  {
    id: 'mnit', org: 'Malaviya National Institute of Technology', place: 'Jaipur, India',
    line: 'BTech in Electronics and Communication Engineering | GPA: 3.8/4', dates: 'May 2024',
    coursework: 'Data Structures and Algorithms, Operating Systems, Graph Theory, Probability, Neural Networks',
  },
];

export const skills: { label: string; items: string }[] = [
  {
    label: 'Languages & ML',
    items: 'Python, SQL, TypeScript, C++, PyTorch, TensorFlow, XGBoost, Hugging Face, pandas, NumPy, CUDA, Weights & Biases, HTML/CSS, Flask, Node.js, React, REST APIs',
  },
  {
    label: 'MLOps',
    items: 'LangGraph, LangChain, Retrieval-Augmented Generation (RAG), Agentic AI, Model Context Protocol (MCP), Tool Calling, FastAPI, AWS (SageMaker, Bedrock, EKS, S3, Lambda), GCP, Docker, Kubernetes, PostgreSQL, CI/CD, Claude Code',
  },
];

export const jobs: Job[] = [
  {
    id: 'tech-observer', org: 'Tech Observer', place: 'Jersey City, NJ', role: 'Data Scientist', dates: 'Aug 2024 – Present',
    bullets: [
      'Architected an agentic clinical adjudication platform automating adverse-event intake, quality control, and case narratives; designed a multi-agent layer behind an API gateway with schema validated outputs reducing human touchpoints by 70%.',
      'Built an anonymization pipeline for clinical documents using OCR and NER removing 100% of identifiers while preserving all of clinical content thereby eliminating need for manual input.',
      'Engineered a HIPAA-oriented de-identification platform reaching 0.97 F1 and 98% anonymization recall on 2,000+ CT images; deployed a computer vision classifier autonomously removing out-of-body footage from 33+ hours of surgical video at 98% accuracy.',
      'Developed a multi-agent financial QA system in LangGraph with agent loop and tools, reconciling figures across 500 documents and cutting review time by 92% through an evidence backed dashboard built with Python, TypeScript and React.',
    ],
  },
  {
    id: 'micron', org: 'Micron Technology', place: 'Hyderabad, India', role: 'Data Science Intern', dates: 'Jan 2024 – Jul 2024',
    bullets: [
      'Launched and deployed PMON, detecting equipment drift by statistical ML methods, triggering preventive maintenance orders, increasing overall fab yield by 0.5% and cutting unplanned downtime by 12 hours per month.',
      'Fine-tuned LLaMA on 10K+ internal TypeScript code snippets to generate frontend widget components, reaching 82% compilation success; integrated LLM into Omelek, a TypeScript framework that 2 engineering teams adopted.',
      'Shipped 3+ full-stack data features for the Manufacturing, Fab, and Planning teams, building React dashboards, Python REST APIs, and PostgreSQL data models deployed on Google Cloud Platform (GCP).',
    ],
    more: {
      lead: 'What the fab taught me, and where it led.',
      points: [
        'The work was real-time sensor anomaly detection in a wafer fab. Equipment drifts: a tool’s temperature creeps, so what counted as normal last quarter is not normal now, and a model that was right then can be quietly wrong today.',
        'People on the floor either trusted automation completely or ignored it. Nothing let trust grow with evidence or shrink when the evidence turned.',
        'Both lessons became Earned Autonomy, the release gate further down this page.',
      ],
    },
  },
  {
    id: 'mitacs', org: 'MITACS', place: 'Edmonton, Canada', role: 'Research Intern', dates: 'May 2023 – Jul 2023',
    bullets: [
      'Trained XGBoost regression models on 10K+ simulation runs through automated data pipelines, replacing costly parameter sweeps with ML-driven analysis and cutting per-design evaluation time from hours to seconds compared with full EM simulation.',
      'Translated model insights into design recommendations for the faculty PI and an industry partner, identifying configurations that raised cutoff frequency by about 15% and improved MRI signal quality.',
    ],
  },
];

export const resumeProjects: ResumeProject[] = [
  {
    id: 'michiganslm', name: 'MichiganSLM: UMich’s first small language model', fromPdf: true, project: 'michiganslm',
    links: [{ label: 'GitHub', href: 'https://github.com/juyal-devashish/umichslm-walkthrough' }],
    bullets: [
      'Pretrained a 1B-parameter small language model on 170B tokens with distributed training across 8 H100 GPUs, using scaling-law experiments from 15M to 300M parameters to pick the most compute-efficient design before committing the GPU budget.',
      'Benchmarked and evaluated 6 model variants on coding, reasoning, and tool-calling tasks; the best model beat a Qwen3-style model and scored 18% lower bits-per-byte than GPT-2, a model 5 times bigger in size.',
    ],
    more: {
      lead: 'A modular transformer codebase, built by a 15-person team at the University of Michigan, so every architecture experiment stays apples-to-apples.',
      points: [
        'One config selects every design choice: attention, position embeddings, sparsity, recurrent layers, memory modules and training objectives. Changing one never means forking the model.',
        'Attention options: MHA, GQA, Multi-head Latent Attention, Gated DeltaNet / Kimi Delta Attention, sliding window with persistent global tokens, MoDA depth attention, Hymba hybrid attention-SSM, Griffin RG-LRU.',
        'Positions: RoPE, PoPE, learned RePo offsets and a DRoPE training schedule. Sparsity: Mixture-of-Experts, progressive MoE and Mixture-of-Depths.',
        'Objectives and memory: sequential and parallel multi-token prediction, chunked cross-entropy, Engram hash n-gram memory, learnable meta and global tokens. Layer reuse: block-wise weight sharing, layer-wise scaling, cross-layer KV sharing.',
        'Training: layer-stacked pretraining with optimizer-state migration, SFT, DPO and GRPO, with TorchTitan and SLURM launchers. Evaluation: perplexity and bits-per-byte, lm-eval-harness, RAG and agentic evaluation.',
        'Hugging Face-compatible, with SwiGLU, RMSNorm, pre-norm blocks and Flash Attention 2. The public repository is a reviewed, regularly refreshed snapshot of the private working codebase.',
      ],
    },
  },
  {
    id: 'sama4', name: 'Sama4: AI News Intelligence Platform', fromPdf: true, project: 'sama4',
    links: [{ label: 'Live', href: 'https://www.sama4.online' }, { label: 'GitHub', href: 'https://github.com/juyal-devashish/Sama4' }],
    bullets: [
      'Built Sama4, a live AI news intelligence platform (Python, FastAPI, Next.js, PostgreSQL, Redis) that explains people, organizations and concepts in context, via an NLP pipeline ingesting 11 sources every 30 minutes.',
      'Engineered a RAG layer combining hybrid NER (spaCy + Claude), Wikidata entity linking and Pinecone vector retrieval; extending it with a real-time voice companion and multi-agent news-impact simulations.',
    ],
    more: {
      lead: 'News assumes you already know the backstory. Sama4 explains the people, places and ideas in a story, right beside the story. Built with Shreyash Methi.',
      points: [
        'Ingestion: fetch, remove near-duplicate stories (MinHash LSH plus fuzzy title matching), clean, find terms, link to Wikidata, summarize with Claude and embed in Pinecone. Each source runs in its own transaction and each article in its own savepoint, so one bad feed never loses the rest.',
        'Hybrid term detection: spaCy finds standard named entities and filters out common-knowledge ones; Claude finds what spaCy can’t see (jargon, policies, acronyms, lesser-known people). The lists are merged, ranked and kept with exact character offsets so the reader highlights terms in place.',
        'Clicking a term: Redis is checked first (explanations are cached for 24 hours); on a miss the backend gathers the Wikipedia summary and the passage of the newest story that mentions the term, Claude writes a 2–3 sentence explanation of why it matters to this story, and related coverage comes from a vector search.',
        'Readers can ask follow-ups such as “why does this matter?”, and an optional multi-agent simulation predicts how the people and groups in a story are likely to react.',
        'All Claude calls go through one client that sets the effort level per task, and requests declined on safety grounds fall back to another model. The Samvād voice companion is a prototype in progress.',
        'Layered backend (routers, services, repositories, one client per external system) where every external service can be swapped for a fake, so 80+ tests run offline; CI runs lint, type checks and tests against a real Postgres. FastAPI on Railway, Next.js on Vercel.',
      ],
    },
  },
  {
    id: 'watermark', name: 'Fast Large Language Model Watermarking', fromPdf: true, project: 'watermark',
    links: [
      { label: 'Link', href: 'https://drive.google.com/file/d/1KNR2OcLC9Ueuu13OQ-wDDC5eKqOUWkYq/view' },
      { label: 'Exhibit', href: 'https://juyal-devashish.github.io/LLM-Sequential-Watermarking/' },
      { label: 'GitHub', href: 'https://github.com/juyal-devashish/LLM-Sequential-Watermarking' },
    ],
    bullets: [
      'Designed an adaptive LLM watermark detection pipeline using sequential hypothesis testing, Monte Carlo methods, and early stopping, cutting detection cost by 95% (thousands of permutations to about 50) across 3 watermarking schemes on an LLM.',
      'Validated robustness against adversarial token insertions, deletions, and substitutions, holding the false-positive rate at 5% while keeping 95% statistical power with 40% of tokens edited.',
    ],
    more: {
      lead: 'A University of Michigan CSE 598 (Winter 2025) group project with four authors.',
      points: [
        'The idea: replace a fixed-budget watermark permutation test with a sequential Monte Carlo test that stops as soon as enough evidence has accumulated.',
        'It combines distortion-free watermark generation (Kuditipudi et al.) with testing by betting (Fischer and Ramdas), and measures detection power, false positives and resampling cost under token edits.',
        'The repository includes the final and midterm reports, slides, and an interactive exhibit with a labeled teaching simulation. Its README lists the validation work still open.',
      ],
    },
  },
  {
    id: 'adjudication', name: 'Agentic Adjudication', fromPdf: false, project: 'adjudication',
    links: [{ label: 'GitHub', href: 'https://github.com/juyal-devashish/Agentic-Adjudication' }],
    bullets: [
      'A proof of concept on synthetic data only: AI agents prepare clinical-trial adverse events for independent adjudication, code checks every agent answer, and people sign every decision.',
      'Built on one rule: agents do the work between the people’s steps, deterministic code decides whether an agent’s answer can be used, and anything that needs medical judgement is done and signed by a person.',
      'Covers four flows end to end: intake, quality check and narrative, adjudication (no AI), and outcome.',
    ],
    more: {
      points: [
        'Intake: eligibility rules in YAML, evaluated declaratively, with every record’s result logged; idempotent imports; one ZIP per case from each site, with corrupt or oversized ZIPs refused with a reason.',
        'Destructive de-identification of PDFs, scans, photos and spreadsheets: text from both the text layer and 300 dpi OCR, identifiers found by Presidio, custom rules and label context, then the output is re-read and checked from scratch. Anything left blocks signing.',
        'Quality check: six deterministic checks, an AI suggestion on every case with quotes that code verifies, a suggested outcome worked out by code (not AI), a hashed PDF dossier, and a narrative agent whose every statement must quote a dossier page and avoid forbidden wording.',
        'An AI answer never moves a case on its own: it must match its schema, every quote must be found on the page it names, its confidence must reach the study’s threshold and every rule check must pass.',
        'An event-sourced, hash-chained audit trail is each case’s only source of truth. One AI gateway (off, replay, live) records every call with its prompt version, tokens, cost and latency under a budget cap, and the whole system runs with AI off.',
        'Each person can also work through a Claude agent in Slack that acts with only their role’s tools; a PHI gate checks every reply before it is posted.',
      ],
    },
  },
  {
    id: 'release-gate', name: 'Earned Autonomy: AI operator release gate', fromPdf: false, project: 'release-gate',
    links: [{ label: 'Live', href: 'https://earned-autonomy.vercel.app' }, { label: 'GitHub', href: 'https://github.com/juyal-devashish/earned-autonomy' }],
    bullets: [
      'A release suite, permission system and production monitor for an AI scheduling operator in a simulated PCB assembly factory. The operator earns autonomy step by step (shadow, supervised, limited) and loses it automatically when production reviews go bad.',
      'Release gate with real model runs: each release runs the same suite of 8 factory scenarios × 10 trials. A release whose data view lacked observed machine cycle times failed; its fix passed 80/80.',
      'Fault-injection replay: with a machine running 30% slow, review agreement fell from 17/17 to 0/17, the monitor’s binomial test demoted the operator, and at the next shift boundary the backend refused its queued action. The fixed release earned 78/80 fresh supervised reviews and was authorized back.',
    ],
    more: {
      points: [
        'Every execution is one atomic transaction that deduplicates, re-checks permission and guardrails, then writes exactly the approved diff or records a refusal.',
        'Eight hard guardrails are pure functions that approval can’t override; an evidence viewer traces each refusal back to the reviews behind it.',
        'Every operator proposal is a real Claude API call, with spend capped by an atomic budget reservation. The factory, orders and reviewer are simulated, and the monitor’s validation is reported separately from the recorded session.',
        'TypeScript, Next.js, Convex, Clerk roles, Sentry, Vitest and Playwright, with 158 unit and backend tests that make no API calls.',
      ],
    },
  },
  {
    id: 'onboarding', name: 'Health-first voice onboarding', fromPdf: false, project: 'onboarding',
    links: [{ label: 'Live', href: 'https://eatopia-demo.vercel.app' }, { label: 'GitHub', href: 'https://github.com/juyal-devashish/eatopia' }],
    bullets: [
      'A nutrition app’s 25-screen onboarding rebuilt as 7 screens on synthetic data: Apple Health first, then three voice prompts.',
      'Plain code turns Health data into seven answers on one card; the model never sees a Health value. Claude fills the remaining questions from a few spoken sentences, limited to each question’s own options, and the member confirms every answer.',
      'Up to 22 of 23 answers are filled for the member, in 13 or 14 taps instead of at least 45.',
    ],
    more: {
      points: [
        'Gender identity is the one question asked on its own: it is never inferred, by code or by the model.',
        'The dietitian gets a short note, with every answer marked as from Health and confirmed, changed, from what the member said, or entered by hand.',
        'A behind-the-scenes panel shows the member’s Health data, what each rule did, and every request sent to the model, word for word. FastAPI and Postgres behind the demo.',
      ],
    },
  },
  {
    id: 'multi-stage-distillation', name: 'Multi-stage distillation', fromPdf: false, project: 'multi-stage-distillation',
    links: [{ label: 'GitHub', href: 'https://github.com/juyal-devashish/ELI500Model-Sequential-Distillation' }],
    bullets: [
      'Compared sequential and parallel knowledge distillation for compressing an LLM from 7B to 1.5B to 0.5B parameters while preserving reasoning, using an intermediate teacher assistant to bridge the capacity gap.',
      'The sequential 0.5B student reached 22.8% lower perplexity and 8.6% higher top-1 accuracy than direct distillation from the 7B teacher.',
    ],
    more: {
      points: [
        'When the gap between teacher and student is too large, direct distillation fails; the approach splits a 14× compression into a 4.7× step and a 3× step.',
        'Teacher Arcee-Spark (7B), intermediate Qwen2-1.5B, student Qwen2-0.5B, trained on FineTome-100k and evaluated on perplexity, top-k accuracy and KL divergence.',
      ],
    },
  },
];

export const activities = '$8K MITACS Fellow; $5K funding from Lambda; $2K funding from AWS; Tech Consultant at ITS UM; AVP Corporate Relations, IEEE';
