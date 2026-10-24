from eduverify_engine.masking import mask_apaar, mask_email, mask_mobile


def test_mask_apaar():
    assert mask_apaar("123456789012") == "1234****9012"
    assert mask_apaar("1234-5678-9012") == "1234****9012"
    assert mask_apaar("  1234 5678 9012  ") == "1234****9012"
    assert mask_apaar(None) == ""
    assert mask_apaar("") == ""
    # Non-standard lengths
    assert mask_apaar("123456") == "12**56"
    assert mask_apaar("123") == "****"


def test_mask_email():
    assert mask_email("student@example.com") == "s***t@example.com"
    assert mask_email("ab@domain.com") == "a*@domain.com"
    assert mask_email("a@b.com") == "a*@b.com"
    assert mask_email(None) == ""
    assert mask_email("invalid-email") == "***"


def test_mask_mobile():
    assert mask_mobile("9876543210") == "98****3210"
    assert mask_mobile("+91 9876543210") == "98****3210"
    assert mask_mobile(None) == ""
    assert mask_mobile("") == ""
    assert mask_mobile("123") == "****"
