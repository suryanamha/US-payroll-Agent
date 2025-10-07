from playwright.sync_api import Page, expect

def test_state_additions(page: Page):
    """
    This test verifies that the newly added states, California and Texas,
    are correctly handled in the UI.
    """
    # 1. Navigate to the application.
    page.goto("http://localhost:5173")

    # 2. Verify California
    # Select "California" from the state dropdown.
    page.get_by_label("State").select_option("CA")

    # Assert that the California-specific fields are visible.
    expect(page.get_by_label("CA State Filing Status")).to_be_visible()
    expect(page.get_by_label("CA State Allowances")).to_be_visible()

    # Take a screenshot for visual verification.
    page.screenshot(path="jules-scratch/verification/california_verification.png")

    # 3. Verify Texas
    # Select "Texas" from the state dropdown.
    page.get_by_label("State").select_option("TX")

    # Assert that no state-specific fields are visible for Texas.
    expect(page.get_by_label("NJ State Filing Status")).not_to_be_visible()
    expect(page.get_by_label("NY State Filing Status")).not_to_be_visible()
    expect(page.get_by_label("CA State Filing Status")).not_to_be_visible()


    # Take a screenshot for visual verification.
    page.screenshot(path="jules-scratch/verification/texas_verification.png")