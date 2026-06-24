import unittest

from fsl_lens_ml.splits import signer_independent_split


class SignerSplitTest(unittest.TestCase):
    def test_signers_do_not_cross_splits_and_unknown_goes_to_train(self):
        samples = [{"id": f"{signer}-{index}", "contributor_id": signer} for signer in ("a", "b", "c", "d") for index in range(2)] + [{"id": "unknown", "contributor_id": None}]
        train, val, test = signer_independent_split(samples, seed=7)
        signer_sets = [{item["contributor_id"] for item in split if item["contributor_id"]} for split in (train, val, test)]
        self.assertTrue(signer_sets[0].isdisjoint(signer_sets[1]) and signer_sets[0].isdisjoint(signer_sets[2]) and signer_sets[1].isdisjoint(signer_sets[2]))
        self.assertIn("unknown", {item["id"] for item in train})


if __name__ == "__main__":
    unittest.main()
