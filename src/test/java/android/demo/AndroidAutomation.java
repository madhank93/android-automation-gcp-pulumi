package android.demo;

import io.appium.java_client.MobileBy;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import java.net.URL;
public class AndroidAutomation {

  private static final String APPIUM = "http://selenoid:4444/wd/hub";
  private AndroidDriver driver;
  private String usernameID = "test-Username";
  private String passwordID = "test-Password";
  private String submitButtonID = "test-LOGIN";
  private By ProductTitle = By.xpath("//android.widget.TextView[@text='PRODUCTS']");

  @BeforeMethod
  public void setUp() throws Exception {
    DesiredCapabilities capabilities = new DesiredCapabilities();
    capabilities.setCapability("deviceName", "Android Emulator");
    capabilities.setCapability("browserName", "android");
    capabilities.setCapability("browserVersion", "6.0");
    capabilities.setCapability("automationName", "UiAutomator2");
    capabilities.setCapability("appWaitActivity", "com.swaglabsmobileapp.MainActivity");
    capabilities.setCapability("enableVNC", true);
    capabilities.setCapability(
        "app",
        "https://github.com/saucelabs/sample-app-mobile/releases/download/2.7.1/Android.SauceLabs.Mobile.Sample.app.2.7.1.apk");

    driver = new AndroidDriver(new URL(APPIUM), capabilities);
  }

  @AfterMethod
  public void tearDown() {
    if (driver != null) {
      driver.quit();
    }
  }

  @Test
  public void loginToSwagLabs() {
    login("standard_user", "secret_sauce");
    Assert.assertTrue(isProductsPageDisplayed());
  }

  public void login(String userName, String password) {
    WebDriverWait wait = new WebDriverWait(driver, 5);
    final WebElement usernameEdit =
        wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                new MobileBy.ByAccessibilityId(usernameID)));
    usernameEdit.click();
    usernameEdit.sendKeys(userName);

    WebElement passwordEdit = driver.findElementByAccessibilityId(passwordID);
    passwordEdit.click();
    passwordEdit.sendKeys(password);

    WebElement submitButton = driver.findElementByAccessibilityId(submitButtonID);
    submitButton.click();
  }

  public boolean isProductsPageDisplayed() {
    WebDriverWait wait = new WebDriverWait(driver, 5);
    try {
      wait.until(ExpectedConditions.visibilityOfElementLocated(ProductTitle));
    } catch (TimeoutException e) {
      System.out.println("Failed to load product page.");
      return false;
    }
    return true;
  }
}
