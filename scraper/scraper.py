import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
from webdriver_manager.chrome import ChromeDriverManager
from time import sleep
from dotenv import load_dotenv
from re import compile

load_dotenv(dotenv_path='../.env')

username = os.getenv("USERNAME")
password = os.getenv("PASSWORD")

chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-gpu-acceleration')

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
wait = WebDriverWait(driver, 10)

def get_posts_links(username):
    driver.get(f"https://www.instagram.com/{username}/saved/all-posts/")

    wait.until(EC.presence_of_element_located((By.TAG_NAME, 'article')))

    soup = BeautifulSoup(driver.page_source, 'html.parser')
    a_tags = soup.find_all("a", href=compile("/p/"))

    return [post_link.get("href") for post_link in a_tags]

def login_to_instagram(username, password):
    driver.get("https://www.instagram.com/accounts/login/")

    # Wait until login form is loaded
    wait.until(EC.presence_of_element_located((By.NAME, 'username')))

    # Fill in username and password
    driver.find_element(By.NAME, "username").send_keys(username)
    driver.find_element(By.NAME, "password").send_keys(password)

    # Submit the form
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

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
    login_to_instagram(username, password)
    post_links = get_posts_links(username)
    remove_from_saved_posts(post_links)
    driver.quit()
    write_posts_to_file(post_links, "./post_links.txt")
