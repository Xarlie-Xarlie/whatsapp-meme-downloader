import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

username = os.getenv("USERNAME")
password = os.getenv("PASSWORD")

def login_to_instagram(username, password):
    driver = webdriver.Chrome()  # You need to have Chrome WebDriver installed
    driver.get("https://www.instagram.com/accounts/login/")

    # Wait until login form is loaded
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, 'username')))

    # Fill in username and password
    driver.find_element(By.NAME, "username").send_keys(username)
    driver.find_element(By.NAME, "password").send_keys(password)

    # Submit the form
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    # Wait until login is completed
    WebDriverWait(driver, 10).until(EC.url_changes("https://www.instagram.com/accounts/login/"))

    return driver

def scroll_to_bottom(driver):
    # Scroll to the bottom of the page
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)  # Add a short delay to allow content to load

# Main script
driver = login_to_instagram(username, password)
scroll_to_bottom(driver)
