import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export default definePreset(Aura, {
    semantic: {
      primary: {
        50:  '{blue.50}',
        100: '{blue.100}',
        200: '{blue.200}',
        300: '{blue.300}',
        400: '{blue.400}',
        500: '{blue.500}',
        600: '{blue.600}',
        700: '{blue.700}',
        800: '{blue.800}',
        900: '{blue.900}',
        950: '{blue.950}'
      },
      /*
          定義明暗模式用的顏色，顏色值可以參考這裡：
          https://primevue.org/theming/styled/#colors
      */
      colorScheme: {
        light: {
          primary: {
            color: '{primary.500}',
            contrastColor: '#ffffff',
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
              background: '#dae4ec', // 原本的淺灰色
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
            contrastColor: '#ffffff',
            hoverColor: '{primary.300}',
            activeColor: '{primary.200}'
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
            background: '#0f172a', // cursor settings 的背景色
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
            background: '#1e293b', // cursor 的背景色
            // background: '#101216',
            // background: '#000000',
            card: '#1a1a1e',
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
      },
    // 可以進一步針對特定元件覆寫樣式，但失效目前找不到原因
    components: {
      button: {
        background: '{primary.color}',
        color:      '{primary.contrastColor}',
        hoverBackground: '{primary.hoverColor}',
        outlined: {
          border: {
            color: '{primary.color}'
          },
          hoverBorderColor: '{primary.hoverColor}'
        }
      },
    }
  }
})
