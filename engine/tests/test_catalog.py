from eduverify_engine.catalog import load_rule_catalog


def test_rule_catalog_loads_and_has_35_rules():
    catalog = load_rule_catalog()
    assert catalog.catalog_version == "0.1.0"
    assert catalog.owner == "team-c"
    assert len(catalog.rules) == 35

    # Check rule IDs are V001 through V035
    expected_ids = [f"V{i:03d}" for i in range(1, 36)]
    actual_ids = [r.id for r in catalog.rules]
    assert actual_ids == expected_ids

    # Check each rule has required fields
    valid_severities = {"ERROR", "WARN", "INFO"}
    valid_priorities = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
    valid_buckets = {"AUTO_FLAG", "HUMAN_REVIEW", "INFO"}

    for rule in catalog.rules:
        assert rule.name, f"Rule {rule.id} missing name"
        assert rule.severity in valid_severities, f"Rule {rule.id} invalid severity {rule.severity}"
        assert rule.default_priority in valid_priorities, (
            f"Rule {rule.id} invalid priority {rule.default_priority}"
        )
        assert rule.bucket_policy in valid_buckets, (
            f"Rule {rule.id} invalid bucket {rule.bucket_policy}"
        )
        assert rule.description, f"Rule {rule.id} missing description"
