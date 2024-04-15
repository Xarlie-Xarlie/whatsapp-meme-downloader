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

    return [post_link.get("href") for post_link in a_tags]

def scroll_to_bottom(driver):
    # Scroll to the bottom of the page
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)  # Add a short delay to allow content to load

    driver.get(url)

    sleep(2)

    driver.find_element(By.NAME, "username").send_keys(username)
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    sleep(4)

def write_posts_to_file(post_links, file_path):
    # Open the file in 'a+' mode, which creates the file if it doesn't exist
    # and allows appending to it
    with open(file_path, 'w') as file:
        # Write each post link to a new line in the file
        for link in post_links:
            file.write(link + '\n')
    
    # Close the file
    file.close()

def remove_from_saved_posts(post_links):
    base_url = "https://www.instagram.com"
    save_xpath = "/html/body/div[2]/div/div/div[2]/div/div/div[1]/section/main/div/div[1]/article/div/div[2]/div/div[2]/section[1]/span[4]/div/div"

    for link in post_links:
        driver.get(base_url + link)
        sleep(1)
        
        driver.find_element(By.XPATH, save_xpath).click()
        sleep(1)

if __name__ == "__main__":
    login()
    post_links = get_posts_links()
    remove_from_saved_posts(post_links)
    driver.quit()
    write_posts_to_file(post_links, "./post_links.txt")
