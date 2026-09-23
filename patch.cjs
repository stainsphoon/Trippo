const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStart = code.indexOf('      // 1. Determine daysUntilStart and weather policy');
const targetEnd = code.indexOf('    const [holidayRes, eventRes] = await Promise.all([');

if (targetStart === -1 || targetEnd === -1) {
  console.log("NOT FOUND");
  process.exit(1);
}

const newCode = `      // 1. Determine daysUntilStart and weather policy
      const nowLocal = DateTime.now().setZone(targetTimezone);
      const startLocal = DateTime.fromISO(startDate, { zone: targetTimezone });
      const daysUntilStart = Math.ceil(startLocal.startOf("day").diff(nowLocal.startOf("day"), "days").days);
      console.log(\`[Weather Decision Flow] Days until start: \${daysUntilStart}\`);

      console.log(\`[Unified Weather Retrieval] Querying unified weather engine for \${name}...\`);
      
      const weatherPromise = getWeather({
        cityId: name,
        countryCode: finalCountryCode,
        latitude: latVal,
        longitude: lngVal,
        timezoneId: targetTimezone,
        startDate,
        endDate,
        forceRefresh: !!forceWeatherRefresh || !!forceRefresh
      }, ai).then(res => {
        validateCoordinatesAndTimezone(name, finalCountryCode, latVal, lngVal, startDate, targetTimezone);
        return res;
      }).catch(fErr => {
        console.warn(\`[Forecast Fetch Failed] Falling back to climate average gracefully: \${fErr.message}\`);
        isErrorFallback = true;
        weatherFetchError = "최신 예보를 불러오지 못해 평년 기후 정보를 보여드리고 있어요.";
        return null;
      });

      const countryCodeClean = finalCountryCode;
      const [weatherDataRes, holidayRes, eventRes] = await Promise.all([
        weatherPromise,
        fetchPublicHolidays(countryCodeClean, startDate, endDate),
        fetchEventsAndFestivals({
          cityName: name,
          countryCode: countryCodeClean,
          startDate,
          endDate,
          ai,
          cityId: placeId,
          cacheId,
          cacheHit: false
        })
      ]);

      weatherData = weatherDataRes;

      let parsedData: any = {
        weather: weatherData,
        congestion: {
          level: "medium",
          description: "관광객 밀집도 정보는 가져오지 못했습니다.",
          descriptionEn: "Could not retrieve tourist density info."
        },
        holidays: [],
        festivals: [],
        summary: "AI가 여행 분석 요약을 작성하지 못했습니다. 하지만 아래에서 실시간 날씨, 공휴일, 축제 데이터는 정상적으로 확인하실 수 있습니다.",
        summaryEn: "AI failed to generate travel summary. However, you can still view real-time weather, public holidays, and festivals below.",
        recommendationScore: 80,
        aiGenerationFailed: false
      };

`;

const endOfPromiseAll = code.indexOf('    ]);', targetEnd) + 7;

code = code.substring(0, targetStart) + newCode + code.substring(endOfPromiseAll);

fs.writeFileSync('server.ts', code);
console.log("PATCHED");
