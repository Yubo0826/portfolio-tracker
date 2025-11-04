import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export default definePreset(Aura, {
    semantic: {
      primary: {
        50:  '{teal.50}',
        100: '{teal.100}',
        200: '{teal.200}',
        300: '{teal.300}',
        400: '{teal.400}',
        500: '{teal.500}',
        600: '{teal.600}',
        700: '{teal.700}',
        800: '{teal.800}',
        900: '{teal.900}',
        950: '{teal.950}'
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
            background: '{zinc.50}',
            focusBackground: '{zinc.700}',
            color: '{zinc.900}',
            focusColor: '{zinc.900}',
          },
          surface: {
              background: '#ffffff',
              card: '#ffffff',
              border: `1px solid var(--p-surface-borderColor)`,
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
          content: {
            // background: '#32323e',
            // background: '#242424',
            background: '#141f34',
            focusBackground: 'rgba(250, 250, 250, .24)',
            color: 'rgba(255,255,255,.87)',
            focusColor: 'rgba(255,255,255,.87)'
          },
          surface: {
            // background: '#272732',
            // background: '#282832',
            background: '#09090b',
            // background: '#1a1a1e',
            card: '#1a1a1e',
            0: '#ffffff',
            50: '{slate.50}',
            100: '{slate.100}',
            200: '{slate.200}',
            300: '{slate.300}',
            400: '{slate.400}',
            500: '{slate.500}',
            600: '{slate.600}',
            700: '{slate.700}',
            800: '{slate.800}',
            900: '{slate.900}',
            950: '{slate.950}'
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
      card: {
        colorScheme: {
          light: {
            root: {
              background: '{surface.card}',
              color:      '{text.color}',
              borderColor: '{border.color}',
              shadow:     '{custom.shadow}'
            }
          },
          dark: {
            root: {
              background: '{surface.card}',
              color:      '{text.color}',
              borderColor: '{border.color}',
              shadow:     '{custom.shadow}'
            }
          }
        }
      }
    }
  }
})
