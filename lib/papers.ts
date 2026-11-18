// Papers. Only read: true ones show on the stack; the rest are the to-read list.
// Every paper has 4 notes: [what it does, why it matters, how it works, key result]
// `readOn` is the day it went on the stack ("Jan 15, 2026"), set only when known; year pages use it alone.
// `date` is what the stack shows; for most papers it is the publication date, not a read date.
export type Paper = { title: string; authors: string; date: string; readOn?: string; link?: string; takeaway: string; tags: string[]; pinned: boolean; read: boolean; notes: string[] };

export const papers: Paper[] = [
  {
    "title": "Attention Is All You Need",
    "authors": "Vaswani et al., NeurIPS 2017",
    "date": "Jan 15, 2026",
    "readOn": "Jan 15, 2026",
    "link": "https://arxiv.org/abs/1706.03762",
    "takeaway": "The transformer architecture dispenses with recurrence and convolutions entirely, relying solely on attention mechanisms — a deceptively simple idea that reshaped the entire field.",
    "tags": [
      "llm",
      "nlp"
    ],
    "pinned": true,
    "read": true,
    "notes": [
      "Proposes the Transformer — a sequence-to-sequence architecture built entirely on self-attention, with no RNNs or CNNs. Encoder and decoder stacks of multi-head attention + feedforward layers, connected by residual paths and layer norms.",
      "It became the backbone of BERT, GPT, and virtually every modern LLM. By removing recurrence, training became fully parallelizable — making it practical to scale to massive datasets and model sizes.",
      "Multi-head self-attention lets each token attend to all others simultaneously. Positional encodings inject sequence order. The encoder maps inputs to a continuous representation; the decoder generates outputs autoregressively attending to both.",
      "SOTA BLEU on WMT'14 English-German and English-French translation, trained in a fraction of the time of prior RNN/CNN models. The quality-to-compute tradeoff was just different enough to shift the whole paradigm."
    ]
  },
  {
    "title": "A Watermark for Large Language Models",
    "authors": "Kirchenbauer et al., ICML 2023",
    "date": "Jan 22, 2026",
    "readOn": "Jan 22, 2026",
    "link": "https://arxiv.org/abs/2301.10226",
    "takeaway": "Embeds a statistical signal into LLM outputs by partitioning the vocabulary into \"green\" and \"red\" lists at each token step — elegant in its simplicity, and surprisingly robust to paraphrasing attacks.",
    "tags": [
      "llm",
      "security"
    ],
    "pinned": true,
    "read": true,
    "notes": [
      "Introduces a practical watermarking scheme for LLM-generated text. At generation time, the model is biased to favor tokens from a \"green list\" derived by hashing the previous token. A z-test on the green-token fraction detects the watermark.",
      "Provides the first practical, model-agnostic method to detect AI-generated text without model access. Directly relevant to AI misuse, academic integrity, and provenance tracking. Sparked a whole subfield.",
      "Before sampling each token, they hash the previous token ID to seed a PRNG, then partition the vocab into a green list (50%) and red list. At generation, logits for green tokens get a soft boost δ. Detection is a one-sided z-test on green-token proportion.",
      ">95% detection power on sequences of 200+ tokens with a false positive rate near 0.01%, and less than 1% perplexity degradation. The watermark survives moderate paraphrasing, which was the surprising part."
    ]
  },
  {
    "title": "Distilling Step-by-Step!",
    "authors": "Hsieh et al., ACL Findings 2023",
    "date": "Feb 3, 2026",
    "readOn": "Feb 3, 2026",
    "link": "https://arxiv.org/abs/2305.02301",
    "takeaway": "Uses chain-of-thought rationales from large models as a supervision signal for smaller ones — a clever way to transfer reasoning capabilities, not just final answers.",
    "tags": [
      "llm",
      "distillation"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "A knowledge distillation framework where a large teacher LLM generates chain-of-thought rationales that then serve as auxiliary supervision for a small student model. The student learns to predict both the label and the reasoning chain.",
      "Shows that a 770M-parameter model trained this way outperforms a 540B teacher (PaLM) on several benchmarks — using orders of magnitude less data than standard fine-tuning. Challenges the assumption that task performance requires scale.",
      "Multi-task learning: the student has one head predicting the label, another predicting the rationale. Both losses are optimized together. The teacher (PaLM 540B) provides rationales via few-shot prompting at dataset construction time, not at inference.",
      "Outperforms standard fine-tuning and distillation baselines across NLI, commonsense QA, and arithmetic tasks, with significantly less labeled data. The rationale supervision is the differentiating factor — labels alone don't close the gap."
    ]
  },
  {
    "title": "Invariant Risk Minimization",
    "authors": "Arjovsky et al., arXiv 2019",
    "date": "Feb 10, 2026",
    "readOn": "Feb 10, 2026",
    "link": "https://arxiv.org/abs/1907.02893",
    "takeaway": "Proposes learning data representations where the optimal classifier is invariant across training environments — a principled approach to OOD generalization that fundamentally challenged ERM assumptions.",
    "tags": [
      "ml",
      "theory"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Introduces IRM, a learning paradigm that finds a feature representation Φ such that the optimal classifier on top of Φ is the same across all training environments. This forces the model to rely on causal, not spurious, features.",
      "ERM (standard training) exploits any correlation in the training data, including spurious ones that don't hold at test time. IRM is a principled attempt to do causal learning from observational data — directly relevant to robustness and fairness.",
      "Bi-level optimization: minimize ERM loss while also penalizing the gradient of a fixed dummy classifier (a scalar 1.0 on Φ). If the gradient is nonzero, it means the classifier isn't optimal everywhere — a sign of non-invariance. IRMv1 relaxes this as a penalty term.",
      "Recovers causal features on ColoredMNIST (a spurious-correlation benchmark) where ERM completely fails. However, real-world results (e.g., WILDS benchmarks) are mixed, and later work showed IRM underperforms ERM in many practical settings. Important caveat."
    ]
  },
  {
    "title": "Sequential Change-Point Detection via Online Convex Optimization",
    "authors": "Hazan et al., 2023",
    "date": "Feb 14, 2026",
    "readOn": "Feb 14, 2026",
    "takeaway": "Frames change-point detection as an online learning problem, achieving near-optimal detection delay with clean regret-style guarantees — a refreshing new lens on a classical statistics problem.",
    "tags": [
      "statistics",
      "theory"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Reformulates sequential change-point detection as an instance of online convex optimization (OCO). The CUSUM statistic emerges naturally from an online mirror descent update, allowing regret analysis to bound detection delay.",
      "Classical CUSUM theory requires parametric assumptions (known pre/post distributions). OCO framing enables data-adaptive, nonparametric detection with rigorous delay guarantees — a cleaner theoretical foundation for modern applications.",
      "Define a loss function tied to the log-likelihood ratio. Run online mirror descent on this sequence of losses. Show that the cumulative loss until a stopping rule triggers has O(log T) regret relative to the optimal fixed-threshold strategy.",
      "Near-optimal expected detection delay under Gaussian mean shift, matching the Lorden lower bound up to log factors. The connection to OCO also gives a clean modular way to plug in different divergences or loss structures."
    ]
  },
  {
    "title": "Language Models are Few-Shot Learners",
    "authors": "Brown et al., NeurIPS 2020",
    "date": "Feb 17, 2026",
    "readOn": "Feb 17, 2026",
    "link": "https://arxiv.org/abs/2005.14165",
    "takeaway": "GPT-3 demonstrates that scale alone unlocks emergent few-shot behavior — raising more questions about what \"learning\" really means than it actually answers.",
    "tags": [
      "llm",
      "survey"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Trains GPT-3 (175B parameters) on a massive diverse text corpus and evaluates it in zero-, one-, and few-shot settings — where \"few-shot\" means in-context examples in the prompt, no gradient updates.",
      "Demonstrated that large-scale pretraining alone produces a model capable of adapting to arbitrary tasks via prompting. Spawned the prompt engineering era and raised deep questions about generalization, memorization, and what in-context learning actually is.",
      "Standard autoregressive LM training on ~300B tokens from Common Crawl, WebText, Books, and Wikipedia. Evaluation is purely inference-time: condition on k examples (k=0,1,few) and score the model's completion. No fine-tuning whatsoever.",
      "Few-shot GPT-3 matches or beats fine-tuned SOTA on SuperGLUE tasks. Performance scales smoothly and predictably with model size, context length, and data — the scaling laws paper companion made this quantitative."
    ]
  },
  {
    "title": "Small Language Models (SLMs) Can Still Pack a Punch: A Survey",
    "authors": "Gupta et al., arXiv 2025",
    "date": "Jan 2025",
    "link": "https://arxiv.org/abs/2501.05465",
    "takeaway": "A survey of about 160 papers showing well-built small models (roughly 1–9B) can match much larger ones.",
    "tags": [
      "llm",
      "survey"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Surveys about 160 papers on small language models of roughly 1–9B parameters, covering general-purpose, task-specific and domain-specific models.",
      "Argues that well-built small models can match or beat much larger ones, making them a cheaper, more efficient option for many uses.",
      "Sorts SLMs by type and by how they are built: distillation, imitation and chain-of-thought training, synthetic data, mixture of experts, quantization and pruning.",
      "Defines 'effective size', meaning a small model's capability measured against LLMs, and uses it to compare SLMs with larger models."
    ]
  },
  {
    "title": "Training Compute-Optimal Large Language Models",
    "authors": "Hoffmann et al., arXiv 2022",
    "date": "Mar 2022",
    "link": "https://arxiv.org/abs/2203.15556",
    "takeaway": "Shows most LLMs are severely undertrained — optimal compute allocation requires scaling data proportionally with model size, yielding the Chinchilla recipe: 70B params, 1.4T tokens.",
    "tags": [
      "llm",
      "theory"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Asks how to split a fixed compute budget between model size and training tokens.",
      "Shows large LLMs of the time were significantly undertrained, because they grew parameters while keeping training data roughly fixed.",
      "Trains over 400 models, from 70M to over 16B parameters on 5–500B tokens, and finds that parameters and tokens should scale in equal proportion.",
      "Chinchilla (70B, about 4× more data) uses the same compute as Gopher (280B) yet beats Gopher, GPT-3, Jurassic-1 and MT-NLG, reaching 67.5% on MMLU."
    ]
  },
  {
    "title": "On the Slow Death of Scaling",
    "authors": "Hooker, SSRN 2025",
    "date": "2025",
    "link": "https://ssrn.com/abstract=5877662",
    "takeaway": "An essay arguing that more training compute no longer reliably buys better AI, and that cheaper methods drive much of the progress.",
    "tags": [
      "llm",
      "theory",
      "survey"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "An essay that questions the long-held belief that scaling training compute reliably buys better AI.",
      "Argues the link between compute and performance is uncertain and shifting, and that faith in scale has sidelined academia and concentrated research in a few labs.",
      "Points to methods that add little compute but large gains (instruction tuning, distillation, chain-of-thought, preference training, RAG). Scaling laws predict pre-training loss but not downstream tasks.",
      "Smaller models such as Llama-3 8B and Aya 23 8B outperform Falcon 180B and BLOOM 176B. Hooker expects future gains from inference-time compute, synthetic data and better interfaces."
    ]
  },
  {
    "title": "Baguettotron: A 321M Parameter Generative Model",
    "authors": "PleIAs, Hugging Face 2025",
    "date": "2025",
    "link": "https://huggingface.co/PleIAs/Baguettotron",
    "takeaway": "A 321M-parameter small reasoning model trained only on open synthetic data that competes with larger small models.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "A 321M-parameter small reasoning model trained natively for instruction following with thinking traces.",
      "Shows that a very small, fully open model trained only on open synthetic data can compete with larger small models.",
      "An 80-layer Qwen/Llama-style decoder, the deepest in its size range, trained on 200B tokens of the synthetic SYNTH dataset on 16 H100s.",
      "PleIAs reports it gets close to Qwen-0.6B and clearly beats similarly sized Gemma on MMLU, GSM8K and HotPotQA."
    ]
  },
  {
    "title": "Textbooks Are All You Need",
    "authors": "Gunasekar et al., arXiv 2023",
    "date": "Jun 2023",
    "link": "https://arxiv.org/abs/2306.11644",
    "takeaway": "Trains phi-1, a 1.3B code model, on filtered “textbook-quality” web data plus synthetic textbooks, showing data quality can stand in for scale.",
    "tags": [
      "llm",
      "distillation"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Trains phi-1, a 1.3B-parameter code model, on 'textbook quality' web data plus synthetic textbooks and exercises generated with GPT-3.5.",
      "Shows that data quality can stand in for scale: a small model trained briefly on few tokens rivals much larger code models.",
      "Uses about 6B tokens of filtered web data and about 1B tokens of synthetic data, trained for 4 days on 8 A100s, then finetuned on coding exercises.",
      "phi-1 scores 50.6% pass@1 on HumanEval and 55.5% on MBPP. A 350M version, phi-1-small, reaches 45% on HumanEval."
    ]
  },
  {
    "title": "Scaling Laws for Optimal Data Mixtures",
    "authors": "Shukor et al., arXiv 2025",
    "date": "Jul 2025",
    "link": "https://arxiv.org/abs/2507.09404",
    "takeaway": "Scaling laws that predict loss from model size, tokens and mixture weights, so a few small runs can pick the data mixture for a large one.",
    "tags": [
      "llm",
      "theory"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Fits scaling laws that predict loss from model size, training tokens and domain mixture weights, then uses them to pick the best mixture for a given compute budget.",
      "Choosing a data mixture by trial and error is too expensive at scale. A few small runs can stand in for a costly sweep.",
      "Extends the Chinchilla loss law with mixture-weight terms. An additive version gives one fixed best mixture. A joint version lets the best mixture shift with model size and tokens.",
      "Laws fit on 412M–1.4B language models predicted losses at 3B and 7B. A 7B model trained on a law-chosen mixture scored 37 on MMLU, against 25–32 for the baselines."
    ]
  },
  {
    "title": "Topic Over Source: The Key to Effective Data Mixing for Language Models Pre-training",
    "authors": "Peng et al., arXiv 2025",
    "date": "Feb 2025",
    "link": "https://arxiv.org/abs/2502.16802",
    "takeaway": "Grouping pretraining data by topic instead of by source gives consistently better data mixtures.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Groups pretraining data by topic instead of by source (web, books, code and so on), then compares how well data-mixing methods work with each grouping.",
      "Most mixing work tunes weights over data sources. Splitting data by topic is a cheap change that gives every existing mixing method a better starting point.",
      "SlimPajama is clustered, the clusters are summarised with GPT-4o, and a BERT classifier sorts the data into 12 topics. RegMix, DoReMi, temperature sampling and a manual mix then run on both groupings.",
      "Topic-based mixing beat source-based mixing with all four methods on 1.3B models, by about 0.5–0.9 points of average accuracy across 9 tasks. With RegMix at 3.3B, the gap was about 0.8 points."
    ]
  },
  {
    "title": "SmolLM2 Technical Report",
    "authors": "Ben Allal et al., arXiv 2025",
    "date": "Feb 2025",
    "link": "https://arxiv.org/abs/2502.02737",
    "takeaway": "An open, fully documented recipe for SmolLM2-1.7B, showing careful staging of training data drives small-model quality.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Describes how Hugging Face trained SmolLM2, a 1.7B-parameter language model, and releases the model along with every dataset built for it.",
      "It is an open, fully documented recipe for a strong small model. It shows that careful choice and staging of training data drives small-model performance.",
      "Overtrains on about 11 trillion tokens in stages, mixing web text with math, code and instruction data. Mixing rates are tuned between stages. New datasets FineMath, Stack-Edu and SmolTalk fill gaps.",
      "SmolLM2-1.7B outperforms recent small models such as Qwen2.5-1.5B and Llama3.2-1B."
    ]
  },
  {
    "title": "The Smol Training Playbook",
    "authors": "Ben Allal et al., Hugging Face 2025",
    "date": "2025",
    "link": "https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook",
    "takeaway": "Hugging Face’s candid guide to training SmolLM3 (3B), including the failed runs and debugging papers usually leave out.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "A long-form guide from Hugging Face on training SmolLM3, a 3B multilingual reasoning model. It includes the failed runs, infrastructure problems and debugging that papers usually leave out.",
      "Published papers rarely show the real cost and decisions behind a model. It gives a full, candid recipe, starting with whether to train at all.",
      "Each choice is tested with small ablations first, such as a 1B model on 45B tokens. Covers architecture, data curation, the main run, post-training (SFT, DPO, GRPO, merging) and infrastructure.",
      "SmolLM3 was trained on 11T tokens using 384 GPUs for about 30 days. Ablations and debugging cost more than half as much compute as the main run."
    ]
  },
  {
    "title": "Hymba: A Hybrid-head Architecture for Small Language Models",
    "authors": "Dong et al. (NVIDIA), arXiv 2024",
    "date": "Nov 2024",
    "link": "https://arxiv.org/abs/2411.13676",
    "takeaway": "Combines Mamba state-space heads with attention heads in the same layer, achieving strong performance with a lower memory footprint than pure-attention models at small scales.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Introduces Hymba, a family of small language models in which every layer runs attention heads and state-space (Mamba-style) heads side by side.",
      "Attention recalls details precisely but its cache is memory-hungry; state-space models summarise context cheaply. Combining both gives small models strong accuracy with a much smaller memory footprint.",
      "Attention and SSM heads process the same input in parallel. Learnable meta tokens prepended to prompts store key information; cross-layer KV sharing and partial sliding-window attention shrink the cache.",
      "Hymba-1.5B-Base beats all public models under 2B parameters and even Llama-3.2-3B, with 1.32% higher average accuracy, an 11.67x smaller cache and 3.49x higher throughput."
    ]
  },
  {
    "title": "Eagle and Finch: RWKV with Matrix-Valued States and Dynamic Recurrence",
    "authors": "Peng et al., arXiv 2024",
    "date": "Apr 2024",
    "link": "https://arxiv.org/abs/2404.05892",
    "takeaway": "Extends RWKV with matrix-valued hidden states and dynamic recurrence gating, closing much of the quality gap with transformers while preserving linear-time inference.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Introduces Eagle (RWKV-5) and Finch (RWKV-6), successors to RWKV-4: recurrent language models that aim to match transformers.",
      "They make RNNs more expressive while keeping RNN-style inference, meaning constant memory per token and no growing KV cache.",
      "Eagle uses multi-headed matrix-valued states. Finch adds dynamic recurrence: decay and token-shift computed from the input through small LoRA-style functions.",
      "Eagle 0.46B–7.5B and Finch 1.6B–3.1B were trained on a new 1.12T-token multilingual corpus. Eagle-7B averages 58.2 on multilingual benchmarks, ahead of Mistral-7B's 55.5."
    ]
  },
  {
    "title": "MobiLlama: Towards Accurate and Lightweight Fully Transparent GPT",
    "authors": "Thawakar et al., arXiv 2024",
    "date": "Feb 2024",
    "link": "https://arxiv.org/abs/2402.16840",
    "takeaway": "A fully open 0.5B model for on-device use that shares one feed-forward block across all layers to cut parameters.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Releases MobiLlama, a 0.5B open small language model built for on-device use, with data pipeline, training code, weights, 300+ checkpoints and evaluation code.",
      "Phones and edge devices need low memory, low energy and fast responses. The paper argues a 'less is more' approach can still give accurate models.",
      "Starts from a 1.2B, 22-layer base and shares one feed-forward block across all layers, cutting trainable parameters by about 60%.",
      "Averages 46.00 across nine benchmarks, ahead of similar-size small models such as Pythia-410M (43.57)."
    ]
  },
  {
    "title": "OpenELM: An Efficient Language Model Family",
    "authors": "Mehta et al., arXiv 2024",
    "date": "Apr 2024",
    "link": "https://arxiv.org/abs/2404.14619",
    "takeaway": "Apple’s fully open model family whose layers each get their own width (layer-wise scaling), released with the whole training framework.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Apple's open language model family, released with the full training and evaluation framework, logs, checkpoints and configs, not just weights.",
      "Earlier releases typically gave only weights and inference code, trained on private data. OpenELM can be reproduced end to end on public data and includes MLX conversion for Apple devices.",
      "Layer-wise scaling gives each transformer layer its own number of attention heads and FFN width, instead of making every layer the same size.",
      "At about 1B parameters, 2.36% more accurate than OLMo with half the pre-training tokens."
    ]
  },
  {
    "title": "Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models",
    "authors": "Cheng et al., arXiv 2026",
    "date": "Jan 2026",
    "link": "https://arxiv.org/abs/2601.07372",
    "takeaway": "Adds an N-gram lookup memory (Engram) alongside mixture-of-experts, a second axis of sparsity that beats an equal-compute MoE.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Proposes Engram, a conditional-memory module that adds constant-time lookup of modernized N-gram embeddings alongside Mixture-of-Experts computation.",
      "Transformers have no built-in way to look up knowledge and imitate retrieval through computation. Static memory gives sparsity a second axis besides MoE.",
      "Static patterns are fetched by N-gram lookup, so the backbone can spend compute on reasoning. A U-shaped scaling law sets how sparse capacity is split between MoE and memory.",
      "A 27B Engram model beats an MoE baseline with equal parameters and FLOPs (MMLU +3.4, BBH +5.0, HumanEval +3.0). Multi-Query NIAH rises from 84.2 to 97.0."
    ]
  },
  {
    "title": "FlexOLMo: Open Language Models for Flexible Data Use",
    "authors": "Shi et al., arXiv 2025",
    "date": "Jul 2025",
    "link": "https://arxiv.org/abs/2507.07024",
    "takeaway": "A mixture-of-experts model whose experts are trained separately by data owners and can be switched on or off at inference.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Introduces FlexOlmo, a mixture-of-experts model family in which each expert is trained separately on its own dataset and merged later without joint training.",
      "Data owners can contribute without sharing raw data, and users can include or exclude a data source at inference time without retraining. This suits regulated or sensitive data.",
      "Experts trained independently are combined through domain-informed routing. Training uses FlexMix, which is public data plus seven domain-specific sets.",
      "Tested at up to 37B total parameters (20B active) on 31 tasks: an average 41% relative improvement, and 10.1% better than earlier model-merging methods."
    ]
  },
  {
    "title": "Front-Loading Reasoning: The Synergy between Pretraining and Post-Training Data",
    "authors": "Akter et al. (NVIDIA), arXiv 2025",
    "date": "Oct 2025",
    "link": "https://arxiv.org/abs/2510.03264",
    "takeaway": "Adding reasoning data during pretraining builds gains that later fine-tuning can’t fully recreate.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Tests whether reasoning data should go into pretraining or wait until post-training, varying its scale, diversity and quality at each stage.",
      "Reasoning data is usually saved for post-training; this shows adding it early builds gains that later SFT cannot fully replicate, even with more data.",
      "Pretrains an 8B hybrid Mamba-attention model from scratch on 1T tokens with different reasoning mixes, then applies matched SFT (and RL) to compare.",
      "Front-loading reasoning gives a 19% average gain. Pretraining rewards diversity (11%), SFT rewards quality (15%), and naively scaling SFT data can erase the early gains."
    ]
  },
  {
    "title": "Midtraining Bridges Pretraining and Posttraining Distributions",
    "authors": "Liu et al., arXiv 2025",
    "date": "Oct 2025",
    "link": "https://arxiv.org/abs/2510.14865",
    "takeaway": "Explains when a midtraining phase helps: most for domains far from web text, like code and math.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Studies midtraining, an intermediate phase that mixes specialized data with general pretraining data, and asks why it helps.",
      "Midtraining is common in practice but poorly understood; this explains when it pays off and how to schedule it.",
      "Pretrains Pythia models (70M–1B) on C4, adds code, math or instruction mixes partway through, then finetunes and measures both target loss and forgetting.",
      "Gains are largest for domains far from web text, like code and math. Midtraining beats continued pretraining on specialized data alone, in-domain and on forgetting."
    ]
  },
  {
    "title": "Balancing the Budget: Understanding Trade-offs Between Supervised and Preference-Based Finetuning",
    "authors": "Raghavendra et al., ACL 2025",
    "date": "2025",
    "link": "https://aclanthology.org/2025.acl-long.1248.pdf",
    "takeaway": "How to split a data-labelling budget: SFT alone wins when small; larger budgets favour more preference data.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Studies how to split a fixed data-annotation budget between supervised finetuning (SFT) and preference finetuning such as DPO.",
      "Post-training data is expensive to label, so knowing which kind to buy at a given budget saves real money.",
      "Sweeps SFT and preference data across budgets, model sizes and four tasks, including the cold-start case of preference tuning straight from the base model.",
      "Below about 1,000 examples, SFT alone wins. Larger budgets favour a mix with a growing share of preference data. Spending under 10% on SFT first fixes the math cold-start, improving GSM8K by about 15–20%."
    ]
  },
  {
    "title": "The Llama 3 Herd of Models",
    "authors": "Dubey et al., arXiv 2024",
    "date": "Jul 2024",
    "link": "https://arxiv.org/abs/2407.21783",
    "takeaway": "Meta's comprehensive report on Llama 3 — covering pretraining data pipeline, architecture decisions, the full post-training stack, and safety work across 8B, 70B, and 405B scales.",
    "tags": [
      "llm",
      "survey"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Meta's report on Llama 3, a family of open models with native multilingual, coding, reasoning and tool-use support.",
      "The most detailed public account of how a frontier-scale open model is built, from data and scaling to post-training and safety.",
      "Uses a standard dense Transformer up to 405B parameters with a 128K-token context, then post-trains it. Image, video and speech are added compositionally.",
      "The 405B model performs comparably to leading models such as GPT-4 on many tasks. Llama Guard 3 is released for input and output safety."
    ]
  },
  {
    "title": "DeepSeek-V3 Technical Report",
    "authors": "DeepSeek-AI, arXiv 2024",
    "date": "Dec 2024",
    "link": "https://arxiv.org/abs/2412.19437",
    "takeaway": "A 671B mixture-of-experts model (37B active) that matches leading closed models on 2.788M H800 GPU hours.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Presents DeepSeek-V3, a mixture-of-experts language model with 671B total parameters, of which 37B are active per token.",
      "Shows an open model can match leading closed models while keeping training cheap and stable.",
      "Combines Multi-head Latent Attention and DeepSeekMoE with load balancing that needs no auxiliary loss, plus a multi-token prediction objective. Pretrained on 14.8T tokens, then SFT and RL.",
      "Beats other open models and is comparable to leading closed ones, using 2.788M H800 GPU hours with no irrecoverable loss spikes."
    ]
  },
  {
    "title": "Data Curation via Joint Example Selection Further Accelerates Multimodal Learning (JEST)",
    "authors": "Evans et al., arXiv 2024",
    "date": "Jun 2024",
    "link": "https://arxiv.org/abs/2406.17711",
    "takeaway": "Scores training examples by their joint utility for an entire mini-batch rather than individually, enabling more efficient pretraining convergence with substantially less data.",
    "tags": [
      "llm",
      "ml"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Picks training data a whole batch at a time, not example by example, for image-text contrastive pretraining.",
      "Data curation becomes a training lever like model size or compute: a small, well-curated reference set can steer learning on a large web dataset.",
      "Scores sub-batches by learnability (learner loss minus a pretrained reference model's loss), samples them chunk by chunk from a larger super-batch, and scores cheaply at low resolution (Flexi-JEST).",
      "Surpasses state-of-the-art models with up to 13x fewer training iterations and 10x less computation."
    ]
  },
  {
    "title": "DeepSeek-V3.2-Exp: Boosting Long-Context Efficiency with DeepSeek Sparse Attention",
    "authors": "DeepSeek-AI, 2025",
    "date": "2025",
    "link": "https://github.com/deepseek-ai/DeepSeek-V3.2-Exp/blob/main/DeepSeek_V3_2.pdf",
    "takeaway": "Extends DeepSeek-V3 with sparse attention patterns that enable efficient long-context processing, reducing KV cache memory and compute without proportional quality losses.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Adds DeepSeek Sparse Attention (DSA) to DeepSeek-V3.1-Terminus through continued training; this is the only architecture change.",
      "Long contexts make attention expensive. DSA cuts the cost of long-context training and inference while benchmark scores stay roughly the same.",
      "A small 'lightning indexer' that can run in FP8 scores the earlier tokens, and each query attends only to its top-k (2048) key-value entries. The indexer is warmed up first, then the model is trained sparse.",
      "Core attention drops from O(L²) to O(Lk). Per-token serving cost falls at long positions, with no substantial benchmark drop versus V3.1-Terminus."
    ]
  },
  {
    "title": "OLMoE: Open Mixture-of-Experts Language Models",
    "authors": "Muennighoff et al., arXiv 2024",
    "date": "Sep 2024",
    "link": "https://arxiv.org/abs/2409.02060",
    "takeaway": "A fully open-sourced sparse MoE language model — releasing weights, training data, and code — establishing a transparency benchmark for mixture-of-experts research.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Releases OLMoE-1B-7B, a sparse mixture-of-experts language model, fully open: weights, training data, code and logs.",
      "MoE models were mostly closed. An open one lets others study routing, expert design and training choices.",
      "Each layer has 64 small experts and 8 are active per token: 6.9B parameters in total, about 1.3B used per token. Pretrained on about 5T tokens, then instruction-tuned.",
      "Outperforms models with similar active parameters, and its instruct version beats larger ones such as Llama2-13B-Chat and DeepSeekMoE-16B."
    ]
  },
  {
    "title": "Explaining Context Length Scaling and Bounds for Language Models",
    "authors": "Shi et al., arXiv 2025",
    "date": "Feb 2025",
    "link": "https://arxiv.org/abs/2502.01481",
    "takeaway": "Derives theoretical bounds on how context length affects LLM performance, providing a principled explanation for the empirical scaling behavior observed in long-context model evaluations.",
    "tags": [
      "llm",
      "theory"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Builds a theory of how context length affects language-model loss, covering both why relevant context helps and why longer context can stop helping.",
      "Gives a principled reason not to simply maximise context length: the best context length depends on how much training data exists.",
      "Splits loss into Bayes risk, which falls as context grows, and approximation loss, which rises with context length. Both are tied to the data's 'intrinsic dimension'.",
      "There is an optimal context length that minimises validation loss, and it grows with dataset size. Shown on OpenWebText and on a synthetic sparse-parity dataset."
    ]
  },
  {
    "title": "Sample-Efficient Language Modeling with Linear Attention and Lightweight Enhancements",
    "authors": "Haller et al., arXiv 2025",
    "date": "Nov 2025",
    "link": "https://arxiv.org/abs/2511.05560",
    "takeaway": "A linear-attention small model for the BabyLM challenge that beats a same-budget Transformer when data is scarce.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Builds BLaLM, a small language model for the BabyLM 2025 challenge, which caps training data at about 10M or 100M words.",
      "Tests whether cheaper linear-time attention and small tweaks help when training data is scarce.",
      "Swaps self-attention for an mLSTM token mixer and adds short convolutions, sliding-window attention with dynamic modulation, and Hedgehog feature maps. Trains with the Muon optimizer on a curated, readable corpus.",
      "Beats a same-budget Transformer on the 10M-word track (35.96 vs 32.27 average) and is roughly on par at 100M words. Muon gives lower perplexity than AdamW."
    ]
  },
  {
    "title": "LIFT: Improving Long Context Understanding via Long Input Fine-Tuning",
    "authors": "Wang et al., arXiv 2025",
    "date": "Feb 2025",
    "link": "https://arxiv.org/abs/2502.14644",
    "takeaway": "A fine-tuning approach for extending LLM context windows that trains the model to attend to information spread across long inputs, improving retrieval accuracy and coherence on long-document tasks.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Lets a short-context LLM handle long inputs by fine-tuning on each input at test time, so the text is stored in its weights rather than its context window.",
      "Long-context ability normally needs bigger windows and expensive long-sequence training; LIFT offers another route for models that already exist.",
      "Splits the input into sentences, has an LLM write QA pairs about each one, and trains LoRA adapters on them. Questions are then answered without the source text.",
      "On LooGLE LongQA with Llama-3-8B-Instruct, scores 27.25 against 15.44 for truncated in-context learning, with perfect accuracy on Needle-in-a-Haystack."
    ]
  },
  {
    "title": "Phi-4 Technical Report",
    "authors": "Abdin et al. (Microsoft Research), arXiv 2024",
    "date": "Dec 2024",
    "link": "https://arxiv.org/abs/2412.08905",
    "takeaway": "A 14B model built around data quality and synthetic data that beats its GPT-4 teacher on STEM questions.",
    "tags": [
      "llm",
      "distillation"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Introduces phi-4, a 14B-parameter language model trained with a central focus on data quality and with synthetic data used throughout training.",
      "Shows that careful data and post-training can let a small model beat its GPT-4 teacher on STEM question answering, going beyond simple distillation.",
      "Keeps the phi-3 architecture almost unchanged. Pretraining covers about 10T tokens, 40% of them synthetic, followed by SFT and two DPO stages, one using Pivotal Token Search.",
      "Scores 56.1 on GPQA and 80.4 on MATH, ahead of GPT-4o (50.6 and 74.6) and Llama-3.3-70B (49.1 and 66.3)."
    ]
  },
  {
    "title": "MiniCPM: Unveiling the Potential of Small Language Models",
    "authors": "Hu et al., arXiv 2024",
    "date": "Apr 2024",
    "link": "https://arxiv.org/abs/2404.06395",
    "takeaway": "A family of sub-3B models from Tsinghua/ModelBest using scaling-law-guided training decisions — showing the 1-2B regime can be highly competitive with careful hyperparameter and data choices.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Introduces MiniCPM, small language models with 1.2B and 2.4B non-embedding parameters, plus DPO, MoE and 128K-context variants.",
      "Shows that small models can be trained carefully enough to stay efficient and cheap while still being competitive.",
      "Picks settings through small-scale 'model wind tunnel' experiments and uses a Warmup-Stable-Decay learning-rate schedule, which allows continued training and cheaper scaling-law studies.",
      "Performs on par with 7B–13B LLMs, and finds a compute-optimal data-to-model ratio well above Chinchilla's."
    ]
  },
  {
    "title": "ORPO: Monolithic Preference Optimization without Reference Model",
    "authors": "Hong et al., arXiv 2024",
    "date": "Mar 2024",
    "link": "https://arxiv.org/abs/2403.07691",
    "takeaway": "Eliminates the reference model from preference optimization by incorporating an odds-ratio penalty directly into the SFT loss — a cleaner, cheaper alternative to DPO and PPO.",
    "tags": [
      "llm"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Proposes ORPO, which aligns a model to preferences during supervised fine-tuning, with no reference model and no separate alignment stage.",
      "Turns the usual SFT-then-RLHF/DPO pipeline into one step, which removes a stage and the cost of a reference model.",
      "Adds a small odds-ratio penalty to the SFT loss that pushes the model away from rejected responses and toward chosen ones.",
      "Mistral-7B tuned with ORPO on UltraFeedback alone reaches 12.20% on AlpacaEval 2.0, 66.19% on IFEval and 7.32 on MT-Bench."
    ]
  },
  {
    "title": "Language Modeling Is Compression",
    "authors": "Delétang et al., arXiv 2023",
    "date": "Sep 2023",
    "link": "https://arxiv.org/abs/2309.10668",
    "takeaway": "Treats LLMs as lossless compressors: a text-trained model compresses images and audio better than PNG and FLAC.",
    "tags": [
      "llm",
      "theory"
    ],
    "pinned": false,
    "read": true,
    "notes": [
      "Evaluates large language models as lossless compressors, using the known equivalence between good prediction and good compression.",
      "The compression view sheds light on scaling laws, tokenization and in-context learning, and shows LLMs are general-purpose predictors beyond text.",
      "Feeds model predictions into arithmetic coding to compress data. In reverse, any compressor such as gzip can be turned into a generative model.",
      "Chinchilla 70B, trained mostly on text, compresses ImageNet patches to 43.4% of raw size, beating PNG (58.5%), and LibriSpeech to 16.4%, beating FLAC (30.3%)."
    ]
  }
];
