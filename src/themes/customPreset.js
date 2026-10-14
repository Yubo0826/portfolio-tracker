import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export default definePreset(Aura, {
    semantic: {
      // 主題色 #316dca（500），其餘色階由它與白/黑混色產生
      primary: {
        50:  '#eff3fb',
        100: '#dae5f5',
        200: '#b1c8eb',
        300: '#88aae0',
        400: '#5a8ad5',
        500: '#316dca',
        600: '#2859a6',
        700: '#204885',
        800: '#193765',
        900: '#122749',
        950: '#0c1a30'
      },
      /*
          定義明暗模式用的顏色，顏色值可以參考這裡：
          https://primevue.org/theming/styled/#colors
      */
      colorScheme: {
        light: {
          primary: {
            color: '{primary.500}',
            contrastColor: '#ffffff', // #316dca 上白字對比約 5:1
            hoverColor: '{primary.600}',
            activeColor: '{primary.700}'
          },
          content: {
            // background: '{zinc.50}',
            background: '#ffffff',
            focusBackground: '{zinc.700}',
            color: '{zinc.900}',
            focusColor: '{zinc.900}',
            borderColor: '{zinc.300}'
          },
          text: {
            color: '{zinc.800}',
            hoverColor: '{zinc.900}',
            // 次要文字（icon、說明文字、次要標籤等）預設 zinc.500 對比度過低（約 4.6:1），偏淡不易閱讀，改用 zinc.600 (約 7:1)
            mutedColor: '{zinc.600}',
            hoverMutedColor: '{zinc.700}'
          },
          surface: {
              // background: '#ffffff',
              // background: '#f4f6fe',
              // background: '#f1f5f9',
              background: '#f0f4f8', // app shell / sidebar 底色
              card: '#ffffff',
              0: '#ffffff',
              50: '{zinc.50}',
              100: '{zinc.100}',
              200: '{zinc.200}',
              300: '{zinc.300}',
              400: '{zinc.400}',
              500: '{zinc.500}',
              600: '{zinc.600}',
              700: '{zinc.700}',
              800: '{zinc.800}',
              900: '{zinc.900}',
              950: '{zinc.950}'
          },
        },
        dark: {
          primary: {
            color: '{primary.500}',
            contrastColor: '#ffffff', // #316dca 上白字對比約 5:1
            hoverColor: '{primary.400}', // 300/200 太淺，白字讀不清
            activeColor: '{primary.600}'
          },
          formField: {
            background: 'transparent',
          },
          dialog: {
            background: '{surface.800}'
          },
          // 卡片背景色、文字色、邊框色等
          content: {
            // background: '#32323e',
            // background: '#242424',
            // background: '#141f34', //原本深藍色
            // background: '#212830', // Github 的卡片、側邊欄配色
            // background: '#22211f', //更深的黑色
            // background: '#242c32', //更深的黑色2
            background: '#1d1e1e', // 卡片、側邊欄（Knowt 配色）
            focusBackground: 'rgba(250, 250, 250, .24)',
            color: 'rgba(255,255,255,.87)',
            focusColor: 'rgba(255,255,255,.87)',
            borderColor: '#444454',
            hoverBackground: 'rgba(255, 255, 255, 0.08)',
          },
          surface: {
            // background: '#101218', // 原本的黑色
            // background: '#282832',
            // background: '#09090b',
            // background: '#1a1a1e',
            // background: '#000c23', // 原本的藍色
            // background: '#151b23', // Github 的背景色
            background: '#0d0d0d', // app shell 底色（Knowt 配色）
            // background: '#101216',
            // background: '#000000',
            card: '#1d1e1e',
            0: '#ffffff',
             50: '{zinc.50}',
            100: '{zinc.100}',
            200: '{zinc.200}',
            300: '{zinc.300}',
            400: '{zinc.400}',
            500: '{zinc.500}',
            600: '{zinc.600}',
            700: '{zinc.700}',
            800: '{zinc.800}',
            900: '{zinc.900}',
            950: '{zinc.950}'
          },
        }
      }
  },
  // 元件覆寫必須放在 semantic 外層才會生效
  // 實心主色按鈕改用 contrast 配色（淺色黑底、深色白底），與 Header「新增交易」一致；值取自 Aura button 的 contrast token
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            primary: {
              background: '{surface.950}', hoverBackground: '{surface.900}', activeBackground: '{surface.800}',
              borderColor: '{surface.950}', hoverBorderColor: '{surface.900}', activeBorderColor: '{surface.800}',
              color: '{surface.0}', hoverColor: '{surface.0}', activeColor: '{surface.0}',
              focusRing: { color: '{surface.950}', shadow: 'none' }
            }
          }
        },
        dark: {
          root: {
            primary: {
              background: '{surface.0}', hoverBackground: '{surface.100}', activeBackground: '{surface.200}',
              borderColor: '{surface.0}', hoverBorderColor: '{surface.100}', activeBorderColor: '{surface.200}',
              color: '{surface.950}', hoverColor: '{surface.950}', activeColor: '{surface.950}',
              focusRing: { color: '{surface.0}', shadow: 'none' }
            }
          }
        }
      }
    }
  }
})
