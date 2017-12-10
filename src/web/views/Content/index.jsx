import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'
import Dropzone from 'react-dropzone'

import { fetchContentCategories, fetchContentMessages, upsertContentMessages, deleteContentMessages } from '~/actions'

import List from './List'
import Manage from './Manage'
import CreateModal from './modal'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

const style = require('./style.scss')

const MESSAGES_PER_PAGE = 20

class ContentView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showModal: false,
      modifyId: null,
      selectedId: 'all',
      page: 1
    }
  }

  componentDidMount() {
    this.props.fetchContentCategories()
    this.fetchCategoryMessages(this.state.selectedId)
  }

  fetchCategoryMessages(id) {
    this.props.fetchContentMessages({
      id,
      count: MESSAGES_PER_PAGE,
      from: (this.state.page - 1) * MESSAGES_PER_PAGE,
      searchTerm: this.state.searchTerm
    })
  }

  currentCategoryId() {
    return this.state.modifyId
      ? _.find(this.props.messages, { id: this.state.modifyId }).categoryId
      : this.state.selectedId
  }

  handleToggleModal() {
    this.setState({ showModal: !this.state.showModal, modifyId: null })
  }

  handleUpsert(formData) {
    const categoryId = this.currentCategoryId()
    this.props
      .upsertContentMessages({ categoryId, formData, modifyId: this.state.modifyId })
      .then(() => this.fetchCategoryMessages(this.state.selectedId))
      .then(() => this.setState({ showModal: false }))
  }

  handleCategorySelected(id) {
    this.fetchCategoryMessages(id)
    this.setState({ selectedId: id })
  }

  handleDeleteSelected(ids) {
    this.props.deleteContentMessages(ids).then(() => this.fetchCategoryMessages(this.state.selectedId))
  }

  handleModalShow(modifyId, categoryId) {
    setTimeout(() => this.setState({ modifyId, showModal: true }), 250)
  }

  handleRefresh() {
    this.fetchCategoryMessages(this.state.selectedId || 'all')
  }

  handlePrevious() {
    this.setState({ page: this.state.page - 1 || 1 })
    setImmediate(() => this.fetchCategoryMessages(this.state.selectedId))
  }

  handleNext() {
    this.setState({ page: this.state.page + 1 })
    setImmediate(() => this.fetchCategoryMessages(this.state.selectedId))
  }

  handleUpload() {
    this.dropzone.open()
  }

  handleDownload() {
    const url = '/content/export'
    window.open(url, '_blank')
  }

  handleDropFiles(acceptedFiles) {
    const txt = `Upload will overwrite existing content if there is conflicting ID's.
      Confirm the upload ${acceptedFiles.length} files?`

    if (acceptedFiles.length > 0 && confirm(txt) == true) {
      let formData = new FormData()
      acceptedFiles.forEach(file => formData.append('files[]', file))

      const headers = { 'Content-Type': 'multipart/form-data' }
      axios.post('/content/upload', formData, { headers }).then(() => this.fetchCategoryMessages(this.state.selectedId))
    }
  }

  handleSearch(input) {
    this.setState({ searchTerm: input })
    setImmediate(() => this.fetchCategoryMessages(this.state.selectedId))
  }

  render() {
    const classNames = classnames({ [style.content]: true, 'bp-content': true })
    const selectedCategory = _.find(this.props.categories, { id: this.currentCategoryId() })

    return (
      <ContentWrapper>
        <PageHeader>
          <span>Content Manager</span>
        </PageHeader>
        <table className={classNames}>
          <tbody>
            <tr>
              <td style={{ width: '20%' }}>
                <List
                  categories={this.props.categories || []}
                  selectedId={this.state.selectedId || 'all'}
                  handleAdd={::this.handleToggleModal}
                  handleCategorySelected={::this.handleCategorySelected}
                />
              </td>
              <td style={{ width: '80%' }}>
                <Dropzone
                  accept="application/json"
                  onDrop={this.handleDropFiles}
                  style={{}}
                  disableClick
                  ref={node => (this.dropzone = node)}
                >
                  <Manage
                    page={this.state.page}
                    count={
                      this.state.selectedId === 'all'
                        ? _.sumBy(this.props.categories, 'count') || 0
                        : _.find(this.props.categories, { id: this.state.selectedId }).count
                    }
                    messagesPerPage={MESSAGES_PER_PAGE}
                    messages={this.props.messages || []}
                    searchTerm={this.state.searchTerm}
                    handlePrevious={::this.handlePrevious}
                    handleNext={::this.handleNext}
                    handleRefresh={::this.handleRefresh}
                    handleModalShow={::this.handleModalShow}
                    handleDeleteSelected={::this.handleDeleteSelected}
                    handleUpload={::this.handleUpload}
                    handleDownload={::this.handleDownload}
                    handleSearch={::this.handleSearch}
                  />
                </Dropzone>
              </td>
            </tr>
          </tbody>
        </table>
        <CreateModal
          show={this.state.showModal}
          schema={(selectedCategory && selectedCategory.schema.json) || {}}
          uiSchema={(selectedCategory && selectedCategory.schema.ui) || {}}
          formData={this.state.modifyId ? _.find(this.props.messages, { id: this.state.modifyId }).formData : null}
          handleCreateOrUpdate={::this.handleUpsert}
          handleClose={::this.handleToggleModal}
        />
      </ContentWrapper>
    )
  }
}

const mapStateToProps = state => ({
  categories: state.content.categories,
  messages: state.content.currentMessages
})
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { fetchContentCategories, fetchContentMessages, upsertContentMessages, deleteContentMessages },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(ContentView)
