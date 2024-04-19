from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import requests as rq

chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-gpu-acceleration')

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

url = "https://saveig.app/en/instagram-video-downloader"

wait = WebDriverWait(driver, 20)  # Adjust the timeout as needed

video_index = 1
with open('./post_links.txt', 'r') as file:
    while True:
        line = file.readline()
        if not line:
            break  # End of file reached
        # Process each line (e.g., print it)
        link = line.strip()  # Remove newline character

        driver.get(url)

        wait.until(EC.presence_of_element_located((By.ID, "s_input")))
        driver.find_element(By.ID, "s_input").send_keys(link)

        driver.find_element(By.XPATH, '//*[@id="search-form"]/div/div').click()

        wait.until(EC.presence_of_element_located((By.ID, "closeModalBtn")))

        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".is-success")))
        a_tags = driver.find_elements(By.CSS_SELECTOR, ".is-success")

        for a in a_tags:
            download_url = a.get_attribute("href")
            try:
                print(f"downloading: {link}")
                response = rq.get(download_url, allow_redirects=True)
            except:
                response = None

            with open(f"./videos/{video_index}.mp4", 'wb') as video:
                if response != None:
                    video.write(response.content)
                video.close()
                print(f"file saved: {video_index}.mp4")

            video_index += 1

print("Downloaded all videos!")
driver.quit()