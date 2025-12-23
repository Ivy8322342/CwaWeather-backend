// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const axios = require("axios");

// const app = express();
// const PORT = process.env.PORT || 3000;

// // CWA API 設定
// const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
// const CWA_API_KEY = process.env.CWA_API_KEY;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /**
//  * 取得高雄天氣預報
//  * CWA 氣象資料開放平臺 API
//  * 使用「一般天氣預報-今明 36 小時天氣預報」資料集
//  */
// const getKaohsiungWeather = async (req, res) => {
//   try {
//     // 檢查是否有設定 API Key
//     if (!CWA_API_KEY) {
//       return res.status(500).json({
//         error: "伺服器設定錯誤",
//         message: "請在 .env 檔案中設定 CWA_API_KEY",
//       });
//     }

//     // 呼叫 CWA API - 一般天氣預報（36小時）
//     // API 文件: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
//     const response = await axios.get(
//       `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
//       {
//         params: {
//           Authorization: CWA_API_KEY,
//           locationName: "高雄市",
//         },
//       }
//     );

//     // 取得高雄市的天氣資料
//     const locationData = response.data.records.location[0];

//     if (!locationData) {
//       return res.status(404).json({
//         error: "查無資料",
//         message: "無法取得高雄市天氣資料",
//       });
//     }

//     // 整理天氣資料
//     const weatherData = {
//       city: locationData.locationName,
//       updateTime: response.data.records.datasetDescription,
//       forecasts: [],
//     };

//     // 解析天氣要素
//     const weatherElements = locationData.weatherElement;
//     const timeCount = weatherElements[0].time.length;

//     for (let i = 0; i < timeCount; i++) {
//       const forecast = {
//         startTime: weatherElements[0].time[i].startTime,
//         endTime: weatherElements[0].time[i].endTime,
//         weather: "",
//         rain: "",
//         minTemp: "",
//         maxTemp: "",
//         comfort: "",
//         windSpeed: "",
//       };

//       weatherElements.forEach((element) => {
//         const value = element.time[i].parameter;
//         switch (element.elementName) {
//           case "Wx":
//             forecast.weather = value.parameterName;
//             break;
//           case "PoP":
//             forecast.rain = value.parameterName + "%";
//             break;
//           case "MinT":
//             forecast.minTemp = value.parameterName + "°C";
//             break;
//           case "MaxT":
//             forecast.maxTemp = value.parameterName + "°C";
//             break;
//           case "CI":
//             forecast.comfort = value.parameterName;
//             break;
//           case "WS":
//             forecast.windSpeed = value.parameterName;
//             break;
//         }
//       });

//       weatherData.forecasts.push(forecast);
//     }

//     res.json({
//       success: true,
//       data: weatherData,
//     });
//   } catch (error) {
//     console.error("取得天氣資料失敗:", error.message);

//     if (error.response) {
//       // API 回應錯誤
//       return res.status(error.response.status).json({
//         error: "CWA API 錯誤",
//         message: error.response.data.message || "無法取得天氣資料",
//         details: error.response.data,
//       });
//     }

//     // 其他錯誤
//     res.status(500).json({
//       error: "伺服器錯誤",
//       message: "無法取得天氣資料，請稍後再試",
//     });
//   }
// };

// // Routes
// app.get("/", (req, res) => {
//   res.json({
//     message: "歡迎使用 CWA 天氣預報 API",
//     endpoints: {
//       kaohsiung: "/api/weather/kaohsiung",
//       health: "/api/health",
//     },
//   });
// });

// app.get("/api/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

// // 取得高雄天氣預報
// app.get("/api/weather/kaohsiung", getKaohsiungWeather);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     error: "伺服器錯誤",
//     message: err.message,
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     error: "找不到此路徑",
//   });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 伺服器運行已運作`);
//   console.log(`📍 環境: ${process.env.NODE_ENV || "development"}`);
// });



// ... 前面 import 和 middleware 部分保持不變 ...

// 1. 建立縣市名稱對照表 (對應前端 select 的 value)
const cityMap = {
  "kaohsiung": "高雄市",
  "taipei": "臺北市",
  "newtaipei": "新北市",
  "taichung": "臺中市",
  "tainan": "臺南市",
  "taoyuan": "桃園市",
  "keelung": "基隆市",
  "hsinchu": "新竹市",
  "pingtung": "屏東縣",
  "yilan": "宜蘭縣",
  "hualien": "花蓮縣",
  "taitung": "臺東縣"
};

/**
 * 通用的天氣預報處理器
 */
const getWeather = async (req, res) => {
  try {
    // 2. 從 URL 取得縣市參數 (例如 /api/weather/taipei)
    const cityParam = req.params.city.toLowerCase();
    const cityName = cityMap[cityParam];

    if (!cityName) {
      return res.status(400).json({
        success: false,
        message: "不支援的縣市名稱"
      });
    }

    if (!CWA_API_KEY) {
      return res.status(500).json({ error: "請設定 CWA_API_KEY" });
    }

    // 3. 呼叫 CWA API，將 locationName 設為動態變數
    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: CWA_API_KEY,
          locationName: cityName, // 動態傳入中文名稱
        },
      }
    );

    const locationData = response.data.records.location[0];

    if (!locationData) {
      return res.status(404).json({ error: "查無資料" });
    }

    // --- 以下整理資料的邏輯保持不變 ---
    const weatherData = {
      city: locationData.locationName,
      updateTime: response.data.records.datasetDescription,
      forecasts: [],
    };

    const weatherElements = locationData.weatherElement;
    const timeCount = weatherElements[0].time.length;

    for (let i = 0; i < timeCount; i++) {
      const forecast = {
        startTime: weatherElements[0].time[i].startTime,
        endTime: weatherElements[0].time[i].endTime,
        weather: "",
        rain: "",
        minTemp: "",
        maxTemp: "",
      };

      weatherElements.forEach((element) => {
        const value = element.time[i].parameter;
        switch (element.elementName) {
          case "Wx": forecast.weather = value.parameterName; break;
          case "PoP": forecast.rain = value.parameterName + "%"; break;
          case "MinT": forecast.minTemp = value.parameterName; break; // 拿掉 °C 讓前端好處理
          case "MaxT": forecast.maxTemp = value.parameterName; break;
        }
      });
      weatherData.forecasts.push(forecast);
    }

    res.json({ success: true, data: weatherData });

  } catch (error) {
    console.error("API 錯誤:", error.message);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
};

// 4. 修改路由：使用 :city 動態路徑
app.get("/api/weather/:city", getWeather);

// ... 後面 listen 部分保持不變 ...