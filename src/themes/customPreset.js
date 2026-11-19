import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export default definePreset(Aura, {
    semantic: {
      // 主題色 #ffb800（500，與 logo 同色），其餘色階由它與白/黑混色產生
      primary: {
        50:  '#fff9eb',
        100: '#fff2d1',
        200: '#ffe49e',
        300: '#ffd66b',
        400: '#ffc633',
        500: '#ffb800',
        600: '#d19700',
        700: '#a37600',
        800: '#7a5800',
        900: '#523b00',
        950: '#332500'
      },
      /*
          定義明暗模式用的顏色，顏色值可以參考這裡：
          https://primevue.org/theming/styled/#colors
      */
      colorScheme: {
        light: {
          primary: {
            // logo 黃 #ffb800 在白底只有 1.7:1，當文字／連結讀不清；淺色改用深一階的金 #a37600（白底 4.1:1）
            color: '{primary.700}',
            contrastColor: '#ffffff',
            hoverColor: '{primary.800}',
            activeColor: '{primary.800}'
          },
          content: {
            // background: '{zinc.50}',
            // 淺色中性色取自 Material 3 帶藍紫調的色階（與 vocabulary-app 同一套），不用冷灰
            background: '#ffffff', // 卡片、側欄、對話框：純白浮在 #f0f4f9 底色上
            focusBackground: '{surface.700}',
            color: '{surface.900}',
            focusColor: '{surface.900}',
            borderColor: '{surface.300}'
          },
          text: {
            color: '{surface.900}',
            hoverColor: '{surface.950}',
            // 次要文字 #5d5e67 在 #ffffff 上約 6.6:1
            mutedColor: '{surface.600}',
            hoverMutedColor: '{surface.700}'
          },
          surface: {
              // background: '#ffffff',
              // background: '#f4f6fe',
              // background: '#f1f5f9',
              background: '#f0f4f9', // app shell 底色（GCP 風格淡藍灰）；主內容區、側欄、卡片都是白色浮在上面
              card: '#ffffff',
              0: '#ffffff',
              50: '#fbf8ff',
              100: '#f2f0f8',
              200: '#e8e6ee',
              300: '#c6c5d0',
              400: '#90909a',
              500: '#767680',
              600: '#5d5e67',
              700: '#46464f',
              800: '#303036',
              900: '#1b1b21',
              950: '#131318'
          },
        },
        dark: {
          primary: {
            color: '{primary.500}', // 深色底直接用 logo 黃（#1d1e1e 上 9.6:1）
            contrastColor: '#1b1b21', // 黃底配深色字，白字只有 1.7:1
            hoverColor: '{primary.400}',
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
