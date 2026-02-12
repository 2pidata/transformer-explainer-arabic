#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
scripts/convert_model.py
Convertit AraGPT2 de PyTorch vers ONNX pour le navigateur
═══════════════════════════════════════════════════════════════════════════════

Usage:
    python scripts/convert_model.py                    # Conversion standard
    python scripts/convert_model.py --quantize        # Avec quantification
    python scripts/convert_model.py --model jais      # Utiliser JAIS
"""

import os
import sys
import argparse
import shutil
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

MODELS = {
    'aragpt2-base': {
        'model_id': 'aubmindlab/aragpt2-base',
        'output_dir': 'static/models/aragpt2-base',
        'task': 'text-generation',
    },
    'aragpt2-medium': {
        'model_id': 'aubmindlab/aragpt2-medium',
        'output_dir': 'static/models/aragpt2-medium',
        'task': 'text-generation',
    },
    'jais': {
        'model_id': 'core42/jais-590m',
        'output_dir': 'static/models/jais-590m',
        'task': 'text-generation',
    },
    'gpt2-small-arabic': {
        'model_id': 'akhooli/gpt2-small-arabic',
        'output_dir': 'static/models/gpt2-small-arabic',
        'task': 'text-generation',
    }
}

DEFAULT_MODEL = 'aragpt2-base'

# ═══════════════════════════════════════════════════════════════════════════════
# INSTALLATION DES DÉPENDANCES
# ═══════════════════════════════════════════════════════════════════════════════

def check_and_install_dependencies():
    """Vérifie et installe les dépendances nécessaires."""
    required_packages = [
        'transformers',
        'optimum',
        'onnx',
        'onnxruntime',
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"📦 Installation des dépendances manquantes: {', '.join(missing)}")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing)
        print("✅ Dépendances installées")

# ═══════════════════════════════════════════════════════════════════════════════
# CONVERSION ONNX
# ═══════════════════════════════════════════════════════════════════════════════

def convert_to_onnx(model_config: dict, output_attentions: bool = True):
    """
    Convertit un modèle HuggingFace vers ONNX avec Optimum.
    
    Args:
        model_config: Configuration du modèle (model_id, output_dir, task)
        output_attentions: Inclure les poids d'attention dans la sortie
    """
    from optimum.onnxruntime import ORTModelForCausalLM
    from transformers import AutoTokenizer, AutoConfig
    
    model_id = model_config['model_id']
    output_dir = Path(model_config['output_dir'])
    
    print(f"\n{'='*60}")
    print(f"🔄 Conversion de {model_id}")
    print(f"{'='*60}")
    
    # Créer le dossier de sortie
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Charger la configuration pour modifier output_attentions
    print("📥 Chargement de la configuration...")
    config = AutoConfig.from_pretrained(model_id)
    
    if output_attentions:
        config.output_attentions = True
        config.output_hidden_states = True
        print("   ✓ Attentions et hidden states activés")
    
    # Charger et sauvegarder le tokenizer
    print("📥 Chargement du tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.save_pretrained(output_dir)
    print(f"   ✓ Tokenizer sauvegardé: {output_dir}")
    
    # Convertir vers ONNX
    print("🔄 Conversion vers ONNX...")
    print("   (Cela peut prendre plusieurs minutes...)")
    
    try:
        # Méthode 1: Utiliser ORTModelForCausalLM (recommandé)
        model = ORTModelForCausalLM.from_pretrained(
            model_id,
            export=True,
            config=config,
        )
        model.save_pretrained(output_dir)
        
    except Exception as e:
        print(f"⚠️ Méthode ORTModel échouée: {e}")
        print("🔄 Tentative avec optimum-cli...")
        
        # Méthode 2: Utiliser optimum-cli
        import subprocess
        cmd = [
            sys.executable, '-m', 'optimum.exporters.onnx',
            '--model', model_id,
            '--task', 'text-generation-with-past',
            str(output_dir)
        ]
        subprocess.run(cmd, check=True)
    
    print(f"✅ Modèle ONNX sauvegardé: {output_dir}")
    
    # Lister les fichiers créés
    print("\n📁 Fichiers créés:")
    for file in sorted(output_dir.iterdir()):
        size = file.stat().st_size
        size_str = f"{size / 1024 / 1024:.1f} MB" if size > 1024*1024 else f"{size / 1024:.1f} KB"
        print(f"   {file.name}: {size_str}")
    
    return output_dir

# ═══════════════════════════════════════════════════════════════════════════════
# QUANTIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

def quantize_model(model_dir: Path, output_suffix: str = '_quantized'):
    """
    Quantifie le modèle ONNX en INT8 pour réduire sa taille.
    
    Args:
        model_dir: Dossier contenant le modèle ONNX
        output_suffix: Suffixe pour le fichier quantifié
    """
    from onnxruntime.quantization import quantize_dynamic, QuantType
    
    print(f"\n{'='*60}")
    print(f"⚡ Quantification du modèle")
    print(f"{'='*60}")
    
    # Trouver le fichier .onnx
    onnx_files = list(model_dir.glob("*.onnx"))
    
    if not onnx_files:
        print("❌ Aucun fichier .onnx trouvé")
        return None
    
    for onnx_file in onnx_files:
        if 'quantized' in onnx_file.name:
            continue
            
        output_file = onnx_file.parent / f"{onnx_file.stem}{output_suffix}.onnx"
        
        print(f"🔄 Quantification de {onnx_file.name}...")
        
        try:
            quantize_dynamic(
                model_input=str(onnx_file),
                model_output=str(output_file),
                weight_type=QuantType.QUInt8,
                optimize_model=True,
            )
            
            # Comparer les tailles
            original_size = onnx_file.stat().st_size / 1024 / 1024
            quantized_size = output_file.stat().st_size / 1024 / 1024
            reduction = (1 - quantized_size / original_size) * 100
            
            print(f"✅ Quantification terminée: {output_file.name}")
            print(f"   Original: {original_size:.1f} MB")
            print(f"   Quantifié: {quantized_size:.1f} MB")
            print(f"   Réduction: {reduction:.1f}%")
            
        except Exception as e:
            print(f"❌ Erreur de quantification: {e}")
            
    return model_dir

# ═══════════════════════════════════════════════════════════════════════════════
# TEST DU MODÈLE
# ═══════════════════════════════════════════════════════════════════════════════

def test_model(model_dir: Path):
    """
    Teste le modèle ONNX converti avec un texte arabe.
    """
    import onnxruntime as ort
    from transformers import AutoTokenizer
    import numpy as np
    
    print(f"\n{'='*60}")
    print(f"🧪 Test du modèle")
    print(f"{'='*60}")
    
    # Charger le tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    
    # Trouver le fichier .onnx (préférer non-quantifié pour le test)
    onnx_files = [f for f in model_dir.glob("*.onnx") if 'quantized' not in f.name]
    if not onnx_files:
        onnx_files = list(model_dir.glob("*.onnx"))
    
    if not onnx_files:
        print("❌ Aucun fichier .onnx trouvé")
        return
    
    onnx_file = onnx_files[0]
    print(f"📂 Modèle: {onnx_file.name}")
    
    # Créer la session ONNX
    session = ort.InferenceSession(str(onnx_file), providers=['CPUExecutionProvider'])
    
    # Afficher les entrées/sorties
    print("\n📥 Entrées du modèle:")
    for input in session.get_inputs():
        print(f"   {input.name}: {input.shape} ({input.type})")
    
    print("\n📤 Sorties du modèle:")
    for output in session.get_outputs():
        print(f"   {output.name}: {output.shape}")
    
    # Texte de test
    test_text = "تصوير البيانات يمكّن المستخدمين من"
    print(f"\n📝 Texte de test: {test_text}")
    
    # Tokeniser
    inputs = tokenizer(test_text, return_tensors="np")
    input_ids = inputs["input_ids"].astype(np.int64)
    
    print(f"🔢 Tokens: {input_ids.shape[1]}")
    print(f"   IDs: {input_ids[0].tolist()}")
    
    # Préparer les feeds
    feeds = {"input_ids": input_ids}
    if "attention_mask" in [i.name for i in session.get_inputs()]:
        feeds["attention_mask"] = np.ones_like(input_ids, dtype=np.int64)
    
    # Exécuter l'inférence
    print("\n⚡ Exécution de l'inférence...")
    outputs = session.run(None, feeds)
    
    # Analyser les résultats
    logits = outputs[0]
    print(f"\n📊 Résultats:")
    print(f"   Shape des logits: {logits.shape}")
    
    # Obtenir les top-5 prédictions pour le dernier token
    last_logits = logits[0, -1, :]
    top_indices = np.argsort(last_logits)[-5:][::-1]
    
    print(f"\n🎯 Top 5 prédictions:")
    for i, idx in enumerate(top_indices):
        token = tokenizer.decode([idx])
        prob = np.exp(last_logits[idx]) / np.sum(np.exp(last_logits))
        print(f"   {i+1}. '{token}' (ID: {idx}, prob: {prob*100:.1f}%)")
    
    print("\n✅ Test réussi!")

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Convertit un modèle HuggingFace vers ONNX pour le navigateur"
    )
    parser.add_argument(
        '--model', '-m',
        choices=list(MODELS.keys()),
        default=DEFAULT_MODEL,
        help=f"Modèle à convertir (défaut: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        '--quantize', '-q',
        action='store_true',
        help="Quantifier le modèle en INT8"
    )
    parser.add_argument(
        '--test', '-t',
        action='store_true',
        help="Tester le modèle après conversion"
    )
    parser.add_argument(
        '--no-attentions',
        action='store_true',
        help="Ne pas inclure les poids d'attention"
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        help="Dossier de sortie personnalisé"
    )
    
    args = parser.parse_args()
    
    # Vérifier les dépendances
    check_and_install_dependencies()
    
    # Configuration du modèle
    model_config = MODELS[args.model].copy()
    if args.output:
        model_config['output_dir'] = args.output
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║        Conversion de modèle vers ONNX                        ║
║        شارح المحوّل - Transformer Explainer                   ║
╚══════════════════════════════════════════════════════════════╝

📦 Modèle: {args.model}
📂 Sortie: {model_config['output_dir']}
⚡ Quantification: {'Oui' if args.quantize else 'Non'}
🧪 Test: {'Oui' if args.test else 'Non'}
""")
    
    # Convertir
    output_dir = convert_to_onnx(
        model_config,
        output_attentions=not args.no_attentions
    )
    
    # Quantifier si demandé
    if args.quantize:
        quantize_model(output_dir)
    
    # Tester si demandé
    if args.test:
        test_model(output_dir)
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║        ✅ Conversion terminée!                               ║
╚══════════════════════════════════════════════════════════════╝

📁 Fichiers dans: {output_dir}

Pour utiliser le modèle dans le navigateur:
1. Copiez le dossier dans static/models/
2. Mettez à jour MODEL_PATHS dans constants.ts
3. Lancez l'application avec 'npm run dev'
""")

if __name__ == "__main__":
    main()
