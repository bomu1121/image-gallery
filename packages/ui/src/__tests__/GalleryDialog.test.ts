import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GalleryDialog from '../components/GalleryDialog.vue';

describe('GalleryDialog', () => {
  const baseConfig = {
    title: 'Test Title',
    message: 'Test Message',
    type: 'info' as const,
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
  };

  it('should render title and message when visible', () => {
    const wrapper = mount(GalleryDialog, {
      props: { visible: true, config: baseConfig },
    });
    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Test Message');
  });

  it('should not render when hidden', () => {
    const wrapper = mount(GalleryDialog, {
      props: { visible: false, config: baseConfig },
    });
    expect(wrapper.find('.gallery-dialog').exists()).toBe(false);
  });

  it('should emit confirm on button click', async () => {
    const wrapper = mount(GalleryDialog, {
      props: { visible: true, config: baseConfig },
    });
    await wrapper.find('.gallery-dialog__btn--confirm').trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('should emit cancel on button click', async () => {
    const wrapper = mount(GalleryDialog, {
      props: { visible: true, config: baseConfig },
    });
    await wrapper.find('.gallery-dialog__btn--cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
