# -*- coding: utf-8 -*-
"""
Tests unitaires — piste d'audit KYC unifiée (dossiers JSON).
Lancement :  python -m unittest discover tests -v
"""
import sys
import os
import shutil
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import audit_trail


class AuditTrailTests(unittest.TestCase):
    def setUp(self):
        # Redirige le stockage vers un répertoire temporaire isolé
        self._saved_dir = audit_trail.AUDIT_DIR
        self._tmp = tempfile.mkdtemp(prefix="sanad-audit-test-")
        audit_trail.AUDIT_DIR = self._tmp

    def tearDown(self):
        audit_trail.AUDIT_DIR = self._saved_dir
        shutil.rmtree(self._tmp, ignore_errors=True)

    def test_creation_dossier(self):
        d = audit_trail.create_dossier()
        self.assertTrue(d["dossierId"].startswith("KYC-"))
        self.assertEqual(d["finalStatus"], "IN_PROGRESS")
        self.assertEqual(d["steps"], [])
        # Persisté sur disque et relisible
        self.assertIsNotNone(audit_trail.get_dossier(d["dossierId"]))

    def test_ajout_etape_horodatee(self):
        d = audit_trail.create_dossier()
        d2 = audit_trail.add_step(d["dossierId"], "OCR_SCAN", "SUCCESS", {"confidence": 82.5})
        self.assertEqual(len(d2["steps"]), 1)
        self.assertEqual(d2["steps"][0]["step"], "OCR_SCAN")
        self.assertIn("timestamp", d2["steps"][0])

    def test_etape_aml_met_a_jour_evaluation_risque(self):
        d = audit_trail.create_dossier()
        d2 = audit_trail.add_step(
            d["dossierId"], "AML_SCREENING", "SUCCESS",
            {"risk_level": "MEDIUM", "risk_score": 20},
        )
        self.assertEqual(d2["riskAssessment"], {"level": "MEDIUM", "score": 20})

    def test_creation_compte_approuve_le_dossier(self):
        d = audit_trail.create_dossier()
        d2 = audit_trail.add_step(d["dossierId"], "ACCOUNT_CREATED", "SUCCESS")
        self.assertEqual(d2["finalStatus"], "APPROVED")

    def test_echec_creation_compte_n_approuve_pas(self):
        # Un échec de création de compte ne doit pas approuver le dossier
        # ni bloquer le CIN pour une nouvelle tentative
        d = audit_trail.create_dossier()
        audit_trail.update_identity(d["dossierId"], {"cin": "55667788"})
        d2 = audit_trail.add_step(d["dossierId"], "ACCOUNT_CREATED", "FAILED", {"reason": "email duplique"})
        self.assertEqual(d2["finalStatus"], "IN_PROGRESS")
        self.assertFalse(audit_trail.is_cin_already_registered("55667788"))

    def test_etape_sur_dossier_inconnu_leve_une_erreur(self):
        with self.assertRaises(ValueError):
            audit_trail.add_step("KYC-INEXISTANT", "OCR_SCAN", "SUCCESS")

    def test_detection_fraude_cin_duplique(self):
        # 1er client : dossier approuvé avec un CIN
        d1 = audit_trail.create_dossier()
        audit_trail.update_identity(d1["dossierId"], {"cin": "11223344", "fullNameLatin": "Premier Client"})
        audit_trail.add_step(d1["dossierId"], "ACCOUNT_CREATED", "SUCCESS")
        self.assertTrue(audit_trail.is_cin_already_registered("11223344"))
        self.assertEqual(audit_trail.get_registered_name_by_cin("11223344"), "Premier Client")

        # 2e tentative avec le même CIN -> fraude détectée
        d2 = audit_trail.create_dossier()
        with self.assertRaises(ValueError):
            audit_trail.update_identity(d2["dossierId"], {"cin": "11223344"})

    def test_cin_non_enregistre_ne_bloque_pas(self):
        self.assertFalse(audit_trail.is_cin_already_registered("00000000"))

    def test_liste_dossiers(self):
        audit_trail.create_dossier()
        audit_trail.create_dossier()
        self.assertEqual(len(audit_trail.list_all_dossiers()), 2)

    def test_protection_traversee_de_chemin(self):
        # Un ID malveillant ne doit pas sortir du répertoire d'audit
        path = audit_trail._dossier_path("../../etc/passwd")
        self.assertTrue(os.path.abspath(path).startswith(os.path.abspath(audit_trail.AUDIT_DIR)))


if __name__ == "__main__":
    unittest.main()
